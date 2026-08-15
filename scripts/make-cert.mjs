import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { networkInterfaces, hostname } from 'node:os'

const DIR = '.certs'
const KEY = `${DIR}/key.pem`
const CERT = `${DIR}/cert.pem`
const MANIFEST = `${DIR}/hosts.json`

/** Every address this machine can be reached on right now. */
function localHosts() {
  const ips = new Set(['127.0.0.1', '::1'])
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (!a.internal) ips.add(a.address)
    }
  }
  const names = new Set(['localhost'])
  const short = hostname().replace(/\.local$/i, '')
  // Bonjour resolves this on the LAN even after DHCP moves the IP.
  names.add(`${short}.local`)
  names.add(short)
  return { ips: [...ips], names: [...names] }
}

/**
 * vite-plugin-basic-ssl only puts localhost and 127.0.0.1 in the SAN list, so
 * phones hitting the LAN address get a cert that does not cover the host they
 * asked for. This mints one that does.
 */
export function ensureCert() {
  const { ips, names } = localHosts()
  const wanted = JSON.stringify({ ips, names })

  if (existsSync(CERT) && existsSync(KEY) && existsSync(MANIFEST)) {
    // The LAN address changes with every DHCP lease; reissue when it moves.
    if (readFileSync(MANIFEST, 'utf8') === wanted) {
      return { key: readFileSync(KEY), cert: readFileSync(CERT), ips, names }
    }
  }

  mkdirSync(DIR, { recursive: true })

  const alt = [
    ...names.map((n, i) => `DNS.${i + 1} = ${n}`),
    ...ips.map((ip, i) => `IP.${i + 1} = ${ip}`),
  ].join('\n')

  const conf = `${DIR}/openssl.cnf`
  writeFileSync(
    conf,
    `[req]
distinguished_name = dn
x509_extensions = v3
prompt = no

[dn]
CN = ${names[1] ?? 'localhost'}
O = Nightfall dev

[v3]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt

[alt]
${alt}
`,
  )

  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-sha256',
    '-days', '397', '-nodes',
    '-keyout', KEY, '-out', CERT,
    '-config', conf,
  ])

  rmSync(conf, { force: true })
  writeFileSync(MANIFEST, wanted)

  return { key: readFileSync(KEY), cert: readFileSync(CERT), ips, names }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ips, names } = ensureCert()
  console.log(`${CERT} covers:`)
  for (const n of names) console.log(`  https://${n}:5173/`)
  for (const ip of ips) if (!ip.includes(':')) console.log(`  https://${ip}:5173/`)
}

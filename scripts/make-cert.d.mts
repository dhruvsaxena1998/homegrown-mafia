/** Mints (or reuses) a dev TLS cert covering every address this machine has. */
export declare function ensureCert(): {
  key: Buffer
  cert: Buffer
  ips: string[]
  names: string[]
}

type EnvTypes = {
  HYGRAPH_URL: string
  HYGRAPH_PERMANENTAUTH_TOKEN: string
}

const env: EnvTypes = {
  HYGRAPH_URL: process.env.HYGRAPH_URL as string,
  HYGRAPH_PERMANENTAUTH_TOKEN: process.env
    .HYGRAPH_PERMANENTAUTH_TOKEN as string,
}

export { env }

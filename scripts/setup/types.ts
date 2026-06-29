export type SetupCommand = "install" | "doctor" | "backup" | "rollback"

export type SetupOptions = {
  readonly command: SetupCommand
  readonly domain: string
  readonly email: string
  readonly siteName: string
  readonly adminUser: string
  readonly adminPassword?: string
  readonly installDir: string
  readonly wordpressDir?: string
  readonly appPort: number
  readonly phpFpmSocket?: string
  readonly dbName?: string
  readonly dbUser?: string
  readonly dbPassword?: string
  readonly skipCertbot: boolean
  readonly noWordpress: boolean
  readonly dryRun: boolean
  readonly yes: boolean
}

export type SetupContext = Required<
  Omit<SetupOptions, "adminPassword" | "dbPassword" | "wordpressDir" | "phpFpmSocket" | "dbName" | "dbUser">
> & {
  readonly adminPassword: string
  readonly wordpressDir: string
  readonly phpFpmSocket: string
  readonly dbName: string
  readonly dbUser: string
  readonly dbPassword: string
  readonly appName: string
  readonly envDir: string
  readonly envFile: string
  readonly releasesDir: string
  readonly releaseDir: string
  readonly sharedDir: string
  readonly sqlitePath: string
  readonly serviceName: string
  readonly nginxAvailable: string
  readonly nginxEnabled: string
  readonly credentialsFile: string
}

export type Operation =
  | { readonly kind: "command"; readonly label: string; readonly command: string }
  | { readonly kind: "write"; readonly label: string; readonly path: string; readonly content: string; readonly mode?: string }
  | { readonly kind: "mkdir"; readonly label: string; readonly path: string }
  | { readonly kind: "symlink"; readonly label: string; readonly target: string; readonly path: string }

export type Phase = {
  readonly name: string
  readonly operations: readonly Operation[]
}

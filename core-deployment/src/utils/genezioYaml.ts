

export function generateGenezioYaml(folderName: string, className: string): string {
  return `name: ${folderName}
region: us-east-1
sdk:
  language: ts
  path: ./sdk
classes:
  - path: ./${className}.ts
    type: jsonrpc
    methods: []`;
}
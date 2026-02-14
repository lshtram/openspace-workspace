import { Terminal } from "../../Terminal"

type Props = {
  directory: string
}

export function TerminalContent({ directory }: Props) {
  return <Terminal directory={directory} />
}

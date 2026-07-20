import { ProbationSettings } from "../../features/probation";

type Props = { showAlert: (message: string, type?: "success" | "info" | "error") => void };

export default function ProbationSettingsTab({ showAlert }: Props) {
  return <ProbationSettings showAlert={showAlert} />;
}

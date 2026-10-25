import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { roles, roleLabels, type OrgRole } from "@/lib/organizations";
export function RoleSelect({
  value,
  onChange,
  owner = false,
  disabled = false,
  label = "Peran",
}: {
  value: OrgRole;
  onChange: (value: OrgRole) => void;
  owner?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const role = roles.find((r) => r === v);
        if (role) onChange(role);
      }}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles
          .filter((r) => r !== "owner" && (owner || r !== "org_admin"))
          .map((r) => (
            <SelectItem key={r} value={r}>
              {roleLabels[r]}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

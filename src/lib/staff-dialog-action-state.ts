export interface StaffDialogActionState {
  status: "idle" | "success" | "error";
  message: string | null;
  fields: {
    displayName: string;
    username: string;
    password: string;
  };
}

const emptyFields: StaffDialogActionState["fields"] = {
  displayName: "",
  username: "",
  password: "",
};

export function buildStaffDialogActionState(
  fields?: Partial<StaffDialogActionState["fields"]>,
): StaffDialogActionState {
  return {
    status: "idle",
    message: null,
    fields: {
      ...emptyFields,
      ...fields,
    },
  };
}

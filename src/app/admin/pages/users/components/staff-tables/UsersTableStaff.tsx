import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import { t } from "i18next";

import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import UserForm from "../shared/UserForm";
import UserActions from "../shared/UserActions";
import {
  StatusTemplate,
  LastConnectionTemplate,
  GroupsTemplate,
} from "../shared/TableTemplates";
import { useUserManagement } from "@hooks/useUserManagement";
import { Scope, User } from "@models/index";
import { ServiceManager } from "@services/index";

interface UsersTableStaffProps {
  rolesIds: string[];
  toast: RefObject<Toast | null>;
}

/**
 * Component that displays a filterable table of users based on their roles, scopes, and groups.
 * Users can be filtered by selecting a specific scope and then a group within that scope.
 * Provides CRUD operations for users within selected groups.
 */
export default function UsersTableStaff({
  rolesIds,
  toast,
}: UsersTableStaffProps) {
  // State for users, scopes, and UI control
  const [users, setUsers] = useState<User[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch users and scopes in parallel for better performance
      const [userData, scopesData] = await Promise.all([
        ServiceManager.users.fetchUsersFromRoles(rolesIds),
        ServiceManager.scopes.fetchScopesFromRoles(rolesIds),
      ]);

      setUsers(userData);
      setScopes(scopesData);
    } catch (err) {
      setError(t("common:states.errorMessage"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rolesIds]);

  // Use custom hook for user management
  const {
    userDialog,
    setUserDialog,
    editMode,
    selectedUser,
    formFields,
    updateFormField,
    resetForm,
    openNewUserDialog,
    openEditUserDialog,
    validateForm,
    confirmDeleteUser,
  } = useUserManagement(fetchData);

  // Fetch users and scopes on component mount or when rolesIds changes
  useEffect(() => {
    fetchData();
  }, [fetchData, rolesIds]);

  // Save user (create or update)
  const saveUser = async () => {
    if (!validateForm()) return;

    try {
      if (editMode && selectedUser) {
        const user = {
          ...selectedUser,
          first_name: formFields.first_name,
          last_name: formFields.last_name,
          email: formFields.email,
        };

        await ServiceManager.users.updateUser(user, [], []);

        toast?.current?.show({
          severity: "success",
          summary: t("common:states.success"),
          detail: t("admin:users:asStaff.messages.userUpdated"),
          life: 3000,
        });
      } else {
        if (!selectedGroup) {
          toast?.current?.show({
            severity: "error",
            summary: t("common:states.validationError"),
            detail: t("admin:users:asStaff.messages.groupRequired"),
            life: 3000,
          });
          return;
        }
        await ServiceManager.users.create(
          formFields.first_name,
          formFields.last_name,
          formFields.email,
          selectedGroup
        );

        toast?.current?.show({
          severity: "success",
          summary: t("common:states.success"),
          detail: t("admin:users:asStaff.messages.userCreated"),
          life: 3000,
        });
      }

      // Reload users list and close dialog
      await fetchData();
      setUserDialog(false);
      resetForm();
    } catch (err) {
      console.error("Error saving user:", err);
      toast?.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: editMode
          ? t("admin:users:asStaff.messages.errorUpdating")
          : t("admin:users:asStaff.messages.errorCreating"),
        life: 3000,
      });
    }
  };

  const handleDeleteUser = async (userID: string) => {
    try {
      await ServiceManager.users.remove(userID);
      toast?.current?.show({
        severity: "success",
        summary: t("common:states.success"),
        detail: t("admin:users:asStaff.messages.userDeleted"),
        life: 3000,
      });
      await fetchData();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast?.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:users:asStaff.messages.errorDeleting"),
        life: 3000,
      });
    }
  };

  // Handle block/unblock user
  const handleToggleBlockUser = async (user: User) => {
    try {
      await ServiceManager.users.toggleBlock(user.id);
      await fetchData();
      toast?.current?.show({
        severity: "success",
        summary: t("common:states.success"),
        detail: user.blocked
          ? t("admin:users:messages.userUnblocked")
          : t("admin:users:messages.userBlocked"),
        life: 3000,
      });
    } catch (err) {
      console.error("Error toggling user block status:", err);
      toast?.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:users:messages.errorBlocking"),
        life: 3000,
      });
    }
  };

  // Handle reset password for user
  const handleResetPassword = async (user: User) => {
    try {
      await ServiceManager.users.resetTargetUserPassword(user.id);
      toast?.current?.show({
        severity: "success",
        summary: t("common:states.success"),
        detail: t("admin:users:messages.passwordReset"),
        life: 3000,
      });
    } catch (err) {
      console.error("Error resetting password:", err);
      toast?.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:users:messages.errorResettingPassword"),
        life: 3000,
      });
    }
  };

  // Handle file import for users
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      !event.target.files ||
      event.target.files.length === 0 ||
      !selectedGroup
    ) {
      return;
    }

    try {
      setLoading(true);
      const file = event.target.files[0];
      await ServiceManager.users.importUsersFromXLSX(selectedGroup, file);

      toast?.current?.show({
        severity: "success",
        summary: t("common:states.success"),
        detail: t("admin:users:import.success"),
        life: 3000,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reload users list
      await fetchData();
    } catch (err) {
      console.error("Error importing users:", err);
      toast?.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:users:import.error"),
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting multiple selected users
  const handleDeleteSelectedUsers = () => {
    confirmDialog({
      message: t("admin:users:asStaff.messages.deleteSelectedConfirm", {
        count: selectedUsers.length,
      }),
      header: t("common:actions.confirmDelete"),
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await ServiceManager.users.removeBulk(
            selectedUsers.map((user) => user.id)
          );

          toast?.current?.show({
            severity: "success",
            summary: t("common:states.success"),
            detail: t("admin:users:asStaff.messages.usersDeleted"),
            life: 3000,
          });

          // Reset selection and refresh data
          setSelectedUsers([]);
          await fetchData();
        } catch (err) {
          console.error("Error deleting users:", err);
          toast?.current?.show({
            severity: "error",
            summary: t("common:states.error"),
            detail: t("admin:users:asStaff.messages.errorDeleting"),
            life: 3000,
          });
        }
      },
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Memoize scope options to prevent unnecessary recalculations
  const scopeOptions = useMemo(() => {
    return scopes.map((scope) => ({
      label: scope.name,
      value: scope.id,
    }));
  }, [scopes]);

  // Get the available groups for the selected scope
  const groupOptions = useMemo(() => {
    if (!selectedScope) return [];

    const scope = scopes.find((scope) => scope.id === selectedScope);
    return (
      scope?.groups?.map((group) => ({
        label: group.name,
        value: group.id,
      })) || []
    );
  }, [selectedScope, scopes]);

  // Filter users based on selected scope and group
  const filteredUsers = useMemo(() => {
    if (!selectedScope || !selectedGroup || !users) return [];

    return users.filter((user) =>
      user.groups?.some((group) => group.id === selectedGroup)
    );
  }, [users, selectedScope, selectedGroup]);

  // Handle scope selection change
  const handleScopeChange = (value: string | null) => {
    setSelectedScope(value);
    setSelectedGroup(null); // Reset group selection when scope changes
  };

  // Auto-select scope if there is only one
  useEffect(() => {
    if (scopes.length === 1 && !selectedScope) {
      setSelectedScope(scopes[0].id);
    }
  }, [scopes, selectedScope]);

  // Auto-select group if there is only one in the selected scope
  useEffect(() => {
    if (groupOptions.length === 1 && !selectedGroup) {
      setSelectedGroup(groupOptions[0].value);
    }
  }, [groupOptions, selectedGroup]);

  // Define table columns
  const columns = [
    { field: "first_name", header: t("common:fields.firstName") },
    { field: "last_name", header: t("common:fields.lastName") },
    { field: "email", header: t("common:fields.email") },
    { field: "last_connected", header: t("common:fields.lastConnection") },
  ];

  // Render different UI states based on loading, error, and data availability
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        <p className="mt-4 text-gray-600">{t("common:states.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Message
        severity="error"
        text={error}
        className="w-full mb-4"
        style={{ borderRadius: "8px" }}
      />
    );
  }

  return (
    <>
      <ConfirmDialog />

      {/* Hidden file input for XLSX import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx"
        style={{ display: "none" }}
      />

      {/* Scope selection dropdown */}
      <div className="mb-4">
        <label
          htmlFor="scopes"
          className="block text-sm font-medium text-white mb-1"
        >
          {t("common:selects.scopes")}
        </label>
        <Dropdown
          id="scopes"
          value={selectedScope}
          options={scopeOptions}
          onChange={(e) => handleScopeChange(e.value)}
          placeholder={t("common:selects.scopes")}
          className="w-full"
        />
      </div>

      {/* Group selection dropdown (only shown when a scope is selected) */}
      {selectedScope && (
        <div className="mb-4">
          <label
            htmlFor="groups"
            className="block text-sm font-medium text-white mb-1"
          >
            {t("common:selects.groups")}
          </label>
          <Dropdown
            id="groups"
            value={selectedGroup}
            options={groupOptions}
            onChange={(e) => setSelectedGroup(e.value)}
            placeholder={t("common:selects.groups")}
            className="w-full"
          />
        </div>
      )}

      {/* Users table (only shown when both scope and group are selected) */}
      {selectedScope && selectedGroup && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              {t("admin:users:asStaff.title")}
            </h2>
            <div className="flex gap-2">
              <Button
                label={t("admin:users:import.button")}
                icon="pi pi-upload"
                className="p-button-secondary"
                onClick={triggerFileInput}
                disabled={!selectedGroup}
              />
              <Button
                label={t("admin:users:asStaff.new")}
                icon="pi pi-plus"
                className="p-button-primary"
                onClick={openNewUserDialog}
              />
              <Button
                label="Delete Selected"
                icon="pi pi-trash"
                className="p-button-danger"
                onClick={handleDeleteSelectedUsers}
                disabled={selectedUsers.length === 0}
              />
            </div>
          </div>

          <DataTable
            value={filteredUsers}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            selection={selectedUsers}
            onSelectionChange={(e) => setSelectedUsers(e.value)}
            selectionMode="checkbox"
            tableStyle={{ minWidth: "50rem" }}
            emptyMessage={t("admin:users:asStaff.noUsersInGroup")}
            className="p-datatable-sm p-datatable-gridlines"
            sortField="lastname"
            sortOrder={1}
            removableSort
          >
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3em" }}
            ></Column>
            {columns.map((col, i) =>
              col.field === "last_connected" ? (
                <Column
                  key={i}
                  field={col.field}
                  header={col.header}
                  body={LastConnectionTemplate}
                />
              ) : (
                <Column
                  key={i}
                  field={col.field}
                  header={col.header}
                  sortable
                />
              )
            )}
            <Column
              field="status"
              header={t("common:fields.status")}
              body={StatusTemplate}
              style={{ width: "10%" }}
            />
            <Column
              field="groups"
              header={t("common:fields.groups")}
              body={GroupsTemplate}
              style={{ width: "10%" }}
            />
            <Column
              body={(rowData) => (
                <UserActions
                  user={rowData}
                  onEdit={openEditUserDialog}
                  onToggleBlock={handleToggleBlockUser}
                  onResetPassword={handleResetPassword}
                  onDelete={(user) => confirmDeleteUser(user, handleDeleteUser)}
                />
              )}
              header={t("common:fields.actions")}
              style={{ width: "15%" }}
              exportable={false}
            />
          </DataTable>
        </>
      )}

      {/* User Form Dialog */}
      <UserForm
        visible={userDialog}
        onHide={() => setUserDialog(false)}
        onSave={saveUser}
        editMode={editMode}
        fields={formFields}
        onFieldChange={updateFormField}
        headerPrefix="admin:users:asStaff"
      />
    </>
  );
}

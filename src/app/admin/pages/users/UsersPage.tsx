import { useEffect, useRef, useState } from "react";
import { t } from "i18next";

import { ProgressSpinner } from "primereact/progressspinner";
import { TabPanel, TabView } from "primereact/tabview";
import { MultiSelect } from "primereact/multiselect";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";

import UsersTableAdmin from "@admin/pages/users/components/admin-tables/UsersTableAdmin";
import UsersTableStaff from "@admin/pages/users/components/staff-tables/UsersTableStaff";

import { ServiceManager } from "@/services";

import { isOwner, roleIsOwner } from "@utils/permissions";

import { useAuth } from "@contexts/AuthContext";
export default function UsersPage() {
  const { user } = useAuth();

  const [selectedRoles, setSelectedRoles] = useState<string[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  const rolesOptions = useRef<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        const roles = isOwner(user)
          ? await ServiceManager.roles.fetchAll()
          : user?.roles || [];

        rolesOptions.current = roles
          .filter((role) => !roleIsOwner(role))
          .map((role) => ({
            label: role.name,
            value: role.id,
          }));
      } catch (err) {
        setError(t("common:states.error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, [user]);

  return (
    <div className="p-4 min-h-screen mb-28">
      <Toast ref={toast} />

      {loading && (
        <div className="flex flex-col items-center justify-center p-6">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
          <p className="mt-4 text-gray-600">{t("common:loading")}</p>
        </div>
      )}

      {error && (
        <Message
          severity="error"
          text={error}
          className="w-full mb-4"
          style={{ borderRadius: "8px" }}
        />
      )}

      {!loading && !error && (
        <div>
          {isOwner(user) ? (
            <TabView>
              <TabPanel header={t("admin:users:views.asAdmin")}>
                <UsersTableAdmin toast={toast} />
              </TabPanel>
              <TabPanel header={t("admin:users:views.asStaff")}>
                <div className="mb-4">
                  <label
                    htmlFor="rolesIds"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    {t("admin:users:asRoles")}
                  </label>
                  <MultiSelect
                    id="rolesIds"
                    value={selectedRoles}
                    options={rolesOptions.current}
                    onChange={(e) => setSelectedRoles(e.value)}
                    placeholder={t("common:selects.roles")}
                    className="w-full"
                    display="chip"
                  />
                </div>
                {selectedRoles && selectedRoles.length > 0 && (
                  <UsersTableStaff rolesIds={selectedRoles} toast={toast} />
                )}
              </TabPanel>
            </TabView>
          ) : (
            <UsersTableStaff
              rolesIds={user?.roles.map((role) => role.id) || []}
              toast={toast}
            />
          )}
        </div>
      )}
    </div>
  );
}

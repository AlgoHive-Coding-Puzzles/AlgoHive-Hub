import { useEffect, useState, useRef } from "react";
import { t } from "i18next";

import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";

import ScopeCard from "@admin/pages/scopes/components/ScopeCard";
import CreateScopeForm from "@admin/pages/scopes/components/CreateScopeForm";
import EditScopeDialog from "@admin/pages/scopes/components/EditScopeDialog";
import ScopeDetailsDialog from "@admin/pages/scopes/components/ScopeDetailsDialog";
import DeleteScopeDialog from "@admin/pages/scopes/components/DeleteScopeDialog";
import { ServiceManager } from "@services/index";

import { Scope } from "@models/index";

export default function ScopesPage() {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingScope, setCreatingScope] = useState<boolean>(false);
  const [updatingScope, setUpdatingScope] = useState<boolean>(false);
  const [deletingScope, setDeletingScope] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null);

  // Dialog visibility states
  const [editDialogVisible, setEditDialogVisible] = useState<boolean>(false);
  const [detailsDialogVisible, setDetailsDialogVisible] =
    useState<boolean>(false);
  const [deleteDialogVisible, setDeleteDialogVisible] =
    useState<boolean>(false);

  const toast = useRef<Toast>(null);
  const apiOptions = useRef<{ label: string; value: string }[]>([]);

  useEffect(() => {
    fetchScopesData();
  }, []);

  const fetchScopesData = async () => {
    try {
      setLoading(true);
      const [fetchedScopes, catalogs] = await Promise.all([
        ServiceManager.scopes.fetchAll(),
        ServiceManager.catalogs.fetchCatalogs(),
      ]);

      setScopes(fetchedScopes);
      apiOptions.current = catalogs.map((catalog) => ({
        label: catalog.name,
        value: catalog.id,
      }));
    } catch (err) {
      setError(t("admin:scopes:messages.fetchError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScope = async (
    name: string,
    description: string,
    selectedApiIds: string[]
  ) => {
    if (!name.trim()) {
      toast.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:scopes:messages.nameRequired"),
        life: 3000,
      });
      return;
    }

    try {
      setCreatingScope(true);
      await ServiceManager.scopes.create(name, description, selectedApiIds);
      await fetchScopesData();

      toast.current?.show({
        severity: "success",
        summary: t("common:states.success"),
        detail: t("admin:scopes:messages.createSuccess"),
        life: 3000,
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:scopes:messages.createError"),
        life: 3000,
      });
      console.error(err);
    } finally {
      setCreatingScope(false);
    }
  };

  const handleUpdateScope = async (
    id: string,
    name: string,
    description: string,
    catalogs_ids: string[]
  ) => {
    if (!name.trim()) {
      toast.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:scopes:messages.nameRequired"),
        life: 3000,
      });
      return;
    }

    try {
      setUpdatingScope(true);
      await ServiceManager.scopes.update(id, name, description, catalogs_ids);
      await fetchScopesData();

      toast.current?.show({
        severity: "success",
        summary: t("common:states.success"),
        detail: t("admin:scopes:messages.updateSuccess"),
        life: 3000,
      });
      setEditDialogVisible(false);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:scopes:messages.updateError"),
        life: 3000,
      });
      console.error(err);
    } finally {
      setUpdatingScope(false);
    }
  };

  const handleDeleteScope = async () => {
    if (!selectedScope) return;

    try {
      setDeletingScope(true);
      await ServiceManager.scopes.remove(selectedScope.id);
      await fetchScopesData();

      toast.current?.show({
        severity: "success",
        summary: t("common:states.success"),
        detail: t("admin:scopes:messages.deleteSuccess"),
        life: 3000,
      });
      setDeleteDialogVisible(false);
    } catch (err) {
      // Check specifically for 409 error message
      if (err instanceof Error && err.message.includes("409")) {
        toast.current?.show({
          severity: "error",
          summary: t("common:states.error"),
          detail: t("admin:scopes:messages.deleteErrorInUse"),
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: t("common:states.error"),
          detail: t("admin:scopes:messages.deleteError"),
          life: 3000,
        });
      }
      console.error(err);
    } finally {
      setDeletingScope(false);
    }
  };

  const openEditDialog = (scope: Scope) => {
    setSelectedScope(scope);
    setEditDialogVisible(true);
  };

  const openDetailsDialog = async (scope: Scope) => {
    try {
      // Fetch the latest scope data to ensure we have all relationships
      const fetchedScope = await ServiceManager.scopes.fetchByID(scope.id);
      setSelectedScope(fetchedScope);
      setDetailsDialogVisible(true);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: t("common:states.error"),
        detail: t("admin:scopes:messages.fetchDetailError"),
        life: 3000,
      });
      console.error(err);
    }
  };

  const openDeleteDialog = (scope: Scope) => {
    setSelectedScope(scope);
    setDeleteDialogVisible(true);
  };

  // Filter scopes based on search query
  const filteredScopes = searchQuery
    ? scopes.filter(
        (scope) =>
          scope.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (scope.description &&
            scope.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : scopes;

  return (
    <div className="p-4 min-h-screen mb-28">
      <Toast ref={toast} />

      {/* Dialogs */}
      <EditScopeDialog
        visible={editDialogVisible}
        scope={selectedScope}
        apiOptions={apiOptions.current}
        onHide={() => setEditDialogVisible(false)}
        onSave={handleUpdateScope}
        loading={updatingScope}
      />

      <ScopeDetailsDialog
        visible={detailsDialogVisible}
        scope={selectedScope}
        onHide={() => setDetailsDialogVisible(false)}
        onEdit={() => {
          setDetailsDialogVisible(false);
          setEditDialogVisible(true);
        }}
      />

      <DeleteScopeDialog
        visible={deleteDialogVisible}
        scope={selectedScope}
        onHide={() => setDeleteDialogVisible(false)}
        onConfirm={handleDeleteScope}
        loading={deletingScope}
      />

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-6">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
          <p className="mt-4 text-gray-600">{t("common:states.loading")}</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Message
          severity="error"
          text={error}
          className="w-full mb-4"
          style={{ borderRadius: "8px" }}
        />
      )}

      {/* Search bar and header */}
      {!loading && !error && (
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            <h1 className="text-2xl font-bold text-white">
              {t("navigation:dock.scopes")}
            </h1>
            <span className="p-input-icon-right w-full md:w-1/3">
              <i className="pi pi-search" style={{ right: "10px" }} />
              <InputText
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("admin:scopes:search") || "Search scopes..."}
                className="w-full"
                style={{ paddingRight: "35px" }}
              />
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && scopes.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white/10 backdrop-blur-md rounded-lg shadow">
          <i className="pi pi-inbox text-5xl text-gray-400 mb-4"></i>
          <p className="text-gray-300 text-xl">
            {t("admin:scopes:messages.notFound")}
          </p>
        </div>
      )}

      {/* Scopes grid */}
      {!loading && !error && (
        <div className="mx-auto px-2">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {/* Create new scope card */}
            <CreateScopeForm
              apiOptions={apiOptions.current}
              onCreateScope={handleCreateScope}
              isLoading={creatingScope}
            />

            {/* Scopes list */}
            {filteredScopes.map((scope) => (
              <ScopeCard
                key={scope.id}
                scope={scope}
                onEdit={() => openEditDialog(scope)}
                onDelete={() => openDeleteDialog(scope)}
                onViewDetails={() => openDetailsDialog(scope)}
              />
            ))}
          </div>

          {/* No results from search */}
          {!loading && !error && filteredScopes.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center p-8 mt-6 bg-white/10 backdrop-blur-md rounded-lg shadow">
              <i className="pi pi-search text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-300 text-lg">
                {t("admin:scopes:noSearchResults") ||
                  "No scopes found matching your search."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

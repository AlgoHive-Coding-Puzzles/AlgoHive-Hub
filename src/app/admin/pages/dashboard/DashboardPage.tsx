import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { Password } from "primereact/password";
import { InputText } from "primereact/inputtext";
import { TabView, TabPanel } from "primereact/tabview";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import LanguageSwitcher from "@shared/components/LanguageSwitcher";

import { ServiceManager } from "@services/index";

import { useActivePage } from "@contexts/ActivePageContext";
import { useAuth } from "@contexts/AuthContext";

export default function DashboardPage() {
  const { t } = useTranslation(["common", "staffTabs"]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const { setActivePage } = useActivePage();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [activeRoles, setActiveRoles] = useState<number>(0);

  // New state variables for profile update
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setActiveRoles(user.roles.length);
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
    }
  }, [newPassword, user]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.current?.show({
        severity: "error",
        summary: t("admin:dashboard:messages.error"),
        detail: t("auth:passwordMismatch"),
      });
      return;
    }

    if (newPassword.length < 8) {
      toast.current?.show({
        severity: "error",
        summary: t("admin:dashboard:messages.error"),
        detail: t("auth:passwordTooShort"),
      });
      return;
    }

    try {
      setIsChangingPass(true);
      await ServiceManager.users.changePassword(oldPassword, newPassword);

      toast.current?.show({
        severity: "success",
        summary: t("admin:dashboard:messages.success"),
        detail: t("admin:dashboard:messages.passwordResetSuccess"),
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: t("admin:dashboard:messages.error"),
        detail: t("admin:dashboard:messages.passwordResetError"),
      });
      console.error(error);
    } finally {
      setIsChangingPass(false);
    }
  };

  const confirmLogout = () => {
    confirmDialog({
      message: t("admin:dashboard:messages.confirmLogout"),
      header: t("admin:dashboard:logoutHeader"),
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        logout();
        navigate("/login");
      },
    });
  };

  const passwordHeader = (
    <div className="flex flex-wrap align-items-center gap-2">
      <span className="font-bold">{t("admin:dashboard:passwordStrength")}</span>
    </div>
  );

  const passwordFooter = (
    <>
      <Divider />
      <p className="mt-2">Suggestions</p>
      <ul className="pl-2 ml-2 mt-0 line-height-3">
        <li>At least one lowercase</li>
        <li>At least one uppercase</li>
        <li>At least one numeric</li>
        <li>Minimum 8 characters</li>
      </ul>
    </>
  );

  const formatLastConnected = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch (e) {
      console.error("Error parsing date:", e);
      return t("admin:dashboard:neverConnected");
    }
  };

  // New function to handle profile update
  const handleUpdateProfile = async () => {
    // Validation
    if (!firstName.trim()) {
      toast.current?.show({
        severity: "error",
        summary: t("admin:dashboard:messages.error"),
        detail: t("admin:users:messages.firstNameRequired"),
      });
      return;
    }

    if (!lastName.trim()) {
      toast.current?.show({
        severity: "error",
        summary: t("admin:dashboard:messages.error"),
        detail: t("admin:users:messages.lastNameRequired"),
      });
      return;
    }

    try {
      setIsUpdating(true);
      await ServiceManager.users.update(firstName, lastName, email);

      // Show success message
      toast.current?.show({
        severity: "success",
        summary: t("admin:dashboard:messages.success"),
        detail: t("admin:dashboard:messages.profileUpdateSuccess"),
      });

      // Optionally, refresh user data
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: t("admin:dashboard:messages.error"),
        detail: t("admin:dashboard:messages.profileUpdateError"),
      });
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 min-h-screen mb-28">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Welcome Section */}
      <div className="mb-6 bg-gradient-to-r from-amber-600 to-orange-400 p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("admin:dashboard:welcome")}, {user?.first_name}{" "}
              {user?.last_name}!
            </h1>
            <p className="text-blue-200">
              {t("admin:dashboard:lastLogin")}:{" "}
              {user?.last_connected
                ? formatLastConnected(user.last_connected)
                : t("admin:dashboard:neverConnected")}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <Avatar
              label={`${user?.first_name.charAt(0)}${user?.last_name.charAt(
                0
              )}`}
              size="large"
              shape="circle"
              className="bg-indigo-700 text-white font-bold"
            />

            <Button
              label={t("admin:dashboard:logout")}
              icon="pi pi-sign-out"
              onClick={confirmLogout}
              className="p-button-text p-button-danger"
              style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
            />
            <Button
              label={t("admin:dashboard:leaveStaffPortal")}
              icon="pi pi-arrow-left"
              onClick={() => navigate("/")}
              className="p-button-text p-button-secondary"
              style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <Card
          className="lg:col-span-2 shadow-lg"
          title={t("admin:dashboard:profileInfo")}
        >
          <TabView>
            <TabPanel header={t("common:fields.roles")}>
              <div className="mt-4 flex flex-wrap gap-2">
                {user?.roles.length ? (
                  user.roles.map((role) => (
                    <Chip
                      key={role.id}
                      label={role.name}
                      icon="pi pi-user-edit"
                      className="bg-indigo-100 text-indigo-800"
                    />
                  ))
                ) : (
                  <p className="text-gray-500">{t("admon:roles:noRoles")}</p>
                )}
              </div>
            </TabPanel>
          </TabView>

          <Divider />

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-3">
              {t("admin:dashboard:accountInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <i className="pi pi-envelope mr-2 text-blue-700"></i>
                <span className="font-medium mr-2">
                  {t("common:fields.email")}:
                </span>
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center">
                <i className="pi pi-id-card mr-2 text-blue-700"></i>
                <span className="font-medium mr-2">ID:</span>
                <span className="text-gray-600">{user?.id}</span>
              </div>
              <div className="flex items-center">
                <i className="pi pi-shield mr-2 text-blue-700"></i>
                <span className="font-medium mr-2">
                  {t("admin:dashboard:status")}:
                </span>
                <span
                  className={user?.blocked ? "text-red-500" : "text-green-500"}
                >
                  {user?.blocked
                    ? t("admin:users:blocked")
                    : t("admin:users:active")}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Password Reset Section */}
        <Card title={t("admin:dashboard:resetPassword")} className="shadow-lg">
          <div className="mb-4">
            <label
              htmlFor="oldpassword"
              className="block text-sm font-medium mb-1"
            >
              {t("admin:dashboard:oldPassword")}
            </label>
            <Password
              id="oldpassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full"
              feedback={false}
              toggleMask
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="new-password"
              className="block text-sm font-medium mb-1"
            >
              {t("admin:dashboard:newPassword")}
            </label>
            <Password
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              toggleMask
              className="w-full"
              header={passwordHeader}
              footer={passwordFooter}
              promptLabel={t("admin:dashboard:enterPassword")}
              weakLabel={t("admin:dashboard:weak")}
              mediumLabel={t("admin:dashboard:medium")}
              strongLabel={t("admin:dashboard:strong")}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium mb-1"
            >
              {t("admin:dashboard:confirmPassword")}
            </label>
            <Password
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              toggleMask
              feedback={false}
              className={`w-full ${
                confirmPassword && newPassword !== confirmPassword
                  ? "p-invalid"
                  : ""
              }`}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <small className="p-error">{t("auth:passwordMismatch")}</small>
            )}
          </div>

          <Button
            label={t("admin:dashboard:updatePassword")}
            icon="pi pi-lock"
            loading={isChangingPass}
            disabled={
              !newPassword ||
              !confirmPassword ||
              !oldPassword ||
              newPassword !== confirmPassword
            }
            onClick={handlePasswordChange}
            className="w-full mt-2"
          />
        </Card>
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xl font-semibold">
              {t("admin:dashboard:activeRoles")}
            </div>
            <Badge value={activeRoles} severity="info" />
          </div>
          <p className="text-gray-500">
            {t("admin:dashboard:rolesDescription")}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {user?.roles.map((role) => (
              <Chip
                key={role.id}
                label={role.name}
                icon="pi pi-user-edit"
                className="bg-indigo-100 text-indigo-800"
              />
            ))}
          </div>
        </Card>

        <Card className="shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xl font-semibold">
              {t("admin:dashboard:quickActions")}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Button
              label={t("navigation:dock.users")}
              icon="pi pi-users"
              className="p-button-sm p-button-outlined"
              onClick={() => setActivePage("users")}
            />
            <Button
              label={t("navigation:dock.competitions")}
              icon="pi pi-flag"
              className="p-button-sm p-button-outlined"
              onClick={() => setActivePage("groups")}
            />
            <Button
              label={t("navigation:dock.catalogs")}
              icon="pi pi-book"
              className="p-button-sm p-button-outlined"
              onClick={() => setActivePage("competitions")}
            />

            <div className="">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="language"
              >
                {t("admin:dashboard:language")}
              </label>
              <Button id="language">
                <LanguageSwitcher />
              </Button>
            </div>
          </div>
        </Card>

        {/* Update Profile panel */}
        <Card className="shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xl font-semibold">
              {t("admin:dashboard:updateProfile")}
            </div>
            <Badge value="Edit" severity="info" />
          </div>

          <div className="mb-3">
            <label
              htmlFor="first_name"
              className="block text-sm font-medium mb-1"
            >
              {t("common:fields.firstName")}
            </label>
            <InputText
              id="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full"
              placeholder={t("common:fields.firstName")}
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium mb-1"
            >
              {t("common:fields.lastName")}
            </label>
            <InputText
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full"
              placeholder={t("common:fields.lastName")}
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium mb-1"
            >
              {t("common:fields.email")}
            </label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              placeholder={t("common:fields.email")}
              autoComplete="off"
            />
          </div>

          <Button
            label={t("admin:dashboard:saveChanges")}
            icon="pi pi-user-edit"
            loading={isUpdating}
            onClick={handleUpdateProfile}
            className="w-full"
          />
        </Card>
      </div>
    </div>
  );
}

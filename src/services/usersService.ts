import { ApiClient } from "../config/ApiClient";
import { User } from "../models/User";

export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await ApiClient.get("/user/");

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function fetchUsersFromRoles(roles: string[]): Promise<User[]> {
  try {
    const response = await ApiClient.get(
      `/user/roles?roles=${roles.join(",")}`
    );

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function createStaffUser(
  firstname: string,
  lastname: string,
  email: string,
  roles: string[]
) {
  try {
    const response = await ApiClient.post("/user/roles", {
      firstname,
      lastname,
      email,
      roles,
    });

    if (response.status !== 201) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// /user/group/{group_id}
export async function createUser(
  firstname: string,
  lastname: string,
  email: string,
  groupeId: string
) {
  try {
    const response = await ApiClient.post(`/user/groups`, {
      firstname,
      lastname,
      email,
      groups: [groupeId],
    });
    if (response.status !== 201) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    const response = await ApiClient.delete(`/user/${userId}`);

    if (response.status !== 204) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function toggleBlockUser(userId: string) {
  try {
    const response = await ApiClient.put(`/user/block/${userId}`);

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error toggling block user:", error);
    throw error;
  }
}

export async function updateUserRoles(
  userId: string,
  roles: string[]
): Promise<void> {
  try {
    const response = await ApiClient.put(`/user/roles`, {
      user_id: userId,
      roles,
    });

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating user roles:", error);
    throw error;
  }
}

export async function updateUserProfile(
  firstname: string,
  lastname: string,
  email: string
) {
  try {
    const response = await ApiClient.put("/user/profile", {
      firstname,
      lastname,
      email,
    });

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function updateTargetUserProfile(
  userId: string,
  firstname: string,
  lastname: string,
  email: string
) {
  try {
    const response = await ApiClient.put(`/user/${userId}`, {
      firstname,
      lastname,
      email,
    });

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error updating target user profile:", error);
    throw error;
  }
}

export async function changePassword(oldPassword: string, newPassword: string) {
  try {
    const response = await ApiClient.put("/user/profile/password", {
      old_password: oldPassword,
      new_password: newPassword,
    });

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
}

export async function resetPassword(userId: string) {
  try {
    const response = await ApiClient.put(`/user/resetpass/${userId}`);

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

export async function resetPasswordWithToken(token: string, password: string) {
  try {
    const response = await ApiClient.post("/auth/reset-password", {
      token,
      password,
    });

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error resetting password with token:", error);
    throw error;
  }
}

export async function importUsersFromXLSX(groupId: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await ApiClient.post(
      `/user/group/${groupId}/import`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.status !== 201) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error importing users:", error);
    throw error;
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const response = await ApiClient.post("/auth/request-reset", {
      email,
    });

    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error requesting password reset:", error);
    throw error;
  }
}

export async function deleteUsers(userIds: string[]) {
  try {
    const response = await ApiClient.delete("/user/bulk", {
      data: userIds,
    });

    if (response.status !== 204) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error deleting users:", error);
    throw error;
  }
}

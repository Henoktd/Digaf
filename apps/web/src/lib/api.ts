const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function fetchEntities() {
  const response = await fetch(`${API_BASE_URL}/api/entities`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch entities");
  }

  return response.json();
}

export async function fetchShareClasses() {
  const response = await fetch(`${API_BASE_URL}/api/share-classes`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch share classes");
  }

  return response.json();
}
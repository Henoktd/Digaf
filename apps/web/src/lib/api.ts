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


export async function fetchShareholders() {
  const response = await fetch(`${API_BASE_URL}/api/shareholders`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch shareholders");
  }

  return response.json();
}

export async function fetchCapTable() {
  const response = await fetch(`${API_BASE_URL}/api/cap-table`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cap table");
  }

  return response.json();
}

export async function fetchCertificates() {
  const response = await fetch(`${API_BASE_URL}/api/certificates`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch certificates");
  }

  return response.json();
}

export async function verifyCertificate(serialNumber: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/verify/${serialNumber}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to verify certificate");
  }

  return response.json();
}
// Shared form-field styling. One convention across the app:
// rounded-lg inputs with a visible brand (indigo) focus ring.

export const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50";

// For <label> rendered as a sibling above the input (pair with htmlFor/id).
export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

// For <label> wrapping the input element (the big-form idiom).
export const wrapLabelClass = "space-y-2 text-sm font-semibold text-slate-700";

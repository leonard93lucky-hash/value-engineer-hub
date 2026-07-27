"use client"

export function api(path: string): string {
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return `/fund${path}`
  }
  return path
}

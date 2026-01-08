"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type Employee = Database["public"]["Tables"]["employees"]["Row"]

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  employee: Pick<Employee, "id" | "name" | "is_active" | "is_admin"> | null
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    employee: null,
  })

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()

      // 1. 사용자 인증 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.replace("/login")
        return
      }

      // 2. employees 테이블에서 권한 확인
      const { data, error: employeeError } = await supabase
        .from("employees")
        .select("id, name, is_active, is_admin")
        .eq("auth_user_id", user.id)
        .single<Pick<Employee, "id" | "name" | "is_active" | "is_admin">>()

      if (employeeError || !data) {
        router.replace("/unauthorized")
        return
      }

      // 3. 비활성 사용자 차단
      if (!data.is_active) {
        router.replace("/unauthorized")
        return
      }

      setState({
        isLoading: false,
        isAuthenticated: true,
        employee: data,
      })
    }

    checkAuth()
  }, [router])

  return state
}

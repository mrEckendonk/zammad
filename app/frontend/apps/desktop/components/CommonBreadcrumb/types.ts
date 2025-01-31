// Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

import type { ComputedRef } from 'vue'

export interface BreadcrumbItem {
  label: string | ComputedRef<string>
  noOptionLabelTranslation?: boolean
  route?: string
  icon?: string
  count?: number
}

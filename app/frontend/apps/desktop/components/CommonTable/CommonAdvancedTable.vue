<!-- Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/ -->

<script setup lang="ts">
import {
  useInfiniteScroll,
  useLocalStorage,
  whenever,
  useEventListener,
} from '@vueuse/core'
import { delay, merge } from 'lodash-es'
import {
  computed,
  nextTick,
  onMounted,
  ref,
  toRef,
  useTemplateRef,
  watch,
  type Ref,
} from 'vue'

import ObjectAttributeContent from '#shared/components/ObjectAttributes/ObjectAttribute.vue'
import { useDebouncedLoading } from '#shared/composables/useDebouncedLoading.ts'
import { useObjectAttributes } from '#shared/entities/object-attributes/composables/useObjectAttributes.ts'
import type { ObjectAttribute } from '#shared/entities/object-attributes/types/store.ts'
import type { TicketById } from '#shared/entities/ticket/types.ts'
import {
  EnumObjectManagerObjects,
  EnumOrderDirection,
} from '#shared/graphql/types.ts'
import { i18n } from '#shared/i18n.ts'
import type { ObjectLike } from '#shared/types/utils.ts'

import CommonActionMenu from '#desktop/components/CommonActionMenu/CommonActionMenu.vue'
import CommonTableRowsSkeleton from '#desktop/components/CommonTable/Skeleton/CommonTableRowsSkeleton.vue'
import TableCaption from '#desktop/components/CommonTable/TableCaption.vue'

import { useTableCheckboxes } from './composables/useTableCheckboxes.ts'
import HeaderResizeLine from './HeaderResizeLine.vue'
import TableRow from './TableRow.vue'
import TableRowGroupBy from './TableRowGroupBy.vue'
import {
  MINIMUM_COLUMN_WIDTH,
  MINIMUM_TABLE_WIDTH,
  type AdvancedTableProps,
  type TableAdvancedItem,
  type TableAttribute,
} from './types.ts'

// TODO: Clarify defaults.
const props = withDefaults(defineProps<AdvancedTableProps>(), {
  maxItems: 1000,
  reachedScrollTop: true,
})

const emit = defineEmits<{
  'click-row': [TableAdvancedItem]
  sort: [string, EnumOrderDirection]
}>()

//  Styling
const cellAlignmentClasses = {
  right: 'ltr:text-right rtl:text-left',
  center: 'text-center',
  left: 'ltr:text-left rtl:text-right',
}

const { attributesLookup: objectAttributesLookup } = props.object
  ? useObjectAttributes(props.object)
  : { attributesLookup: null }

const localAttributesLookup = computed(() => {
  const lookup: Map<string, TableAttribute> = new Map()

  props.attributes?.forEach((attribute) =>
    lookup.set(attribute.name, attribute),
  )

  return lookup
})

const findAttribute = <T,>(headerName: string, lookup: Map<string, T>) => {
  return (
    lookup?.get(headerName) ||
    lookup?.get(`${headerName}_id`) ||
    lookup?.get(`${headerName}_ids`)
  )
}

const localHeaders = computed(() => {
  if (!props.groupBy) return props.headers

  return props.headers.filter((header) => header !== props.groupBy)
})

// TODO: bulk checkbox fixed in template

const rightAlignedDataTypes = ['date', 'datetime', 'integer']

const tableAttributes = computed(() => {
  const table: TableAttribute[] = []

  // Process each header
  localHeaders.value.forEach((headerName) => {
    // Try to find matching attribute from both sources
    const localAttribute = findAttribute(
      headerName,
      localAttributesLookup.value,
    )
    const objectAttribute = objectAttributesLookup?.value
      ? findAttribute(headerName, objectAttributesLookup.value)
      : null

    // Skip if no attribute definition found
    if (!localAttribute && !objectAttribute) return

    const attributeExtension = props.attributeExtensions?.[headerName]

    // Convert ObjectAttribute to TableAttribute structure if it exists
    const mergedAttribute = objectAttribute
      ? (merge(
          {
            name: objectAttribute.name,
            label: objectAttribute.display,
            dataType: objectAttribute.dataType,
            dataOption: objectAttribute.dataOption || {},
            headerPreferences: {},
            columnPreferences: {},
          },
          attributeExtension,
        ) as TableAttribute)
      : (localAttribute as TableAttribute)

    // Set default alignment for right-aligned data types.
    if (
      rightAlignedDataTypes.includes(mergedAttribute.dataType) &&
      !mergedAttribute.columnPreferences.alignContent
    ) {
      mergedAttribute.columnPreferences.alignContent = 'right'
    }

    table.push(mergedAttribute)
  })

  return table
})

const tableColumnLength = computed(() => {
  return tableAttributes.value.length + (props.actions ? 1 : 0)
})

const tableElement = useTemplateRef('table')

// FIXME: Temporary initialization to avoid empty reference.
let headerWidthsRelativeStorage: Ref<Record<string, number>> = ref({})

const setHeaderWidths = (reset?: boolean) => {
  if (!tableElement.value || !tableElement.value.parentElement) return

  const availableWidth = tableElement.value.parentElement.clientWidth

  const tableWidth =
    availableWidth < MINIMUM_TABLE_WIDTH ? MINIMUM_TABLE_WIDTH : availableWidth

  tableElement.value.style.width = `${tableWidth}px`

  tableAttributes.value.forEach((tableAttribute) => {
    const header = document.getElementById(`${tableAttribute.name}-header`)
    if (!header) return

    if (reset) {
      if (tableAttribute.headerPreferences.displayWidth)
        header.style.width = `${tableAttribute.headerPreferences.displayWidth}px`
      else header.style.width = '' // reflow
      return
    }

    const headerWidthRelative =
      headerWidthsRelativeStorage.value[tableAttribute.name]

    const headerWidth =
      tableAttribute.headerPreferences.displayWidth ??
      Math.max(MINIMUM_COLUMN_WIDTH, headerWidthRelative * tableWidth)

    header.style.width = `${headerWidth}px`
  })
}

const storeHeaderWidths = (headerWidths: Record<string, number>) => {
  const headerWidthsRelative = Object.keys(headerWidths).reduce(
    (headerWidthsRelative, headerName) => {
      if (!tableElement.value) return headerWidthsRelative
      headerWidthsRelative[headerName] =
        headerWidths[headerName] / tableElement.value.clientWidth
      return headerWidthsRelative
    },
    {} as Record<string, number>,
  )

  headerWidthsRelativeStorage.value = headerWidthsRelative
}

const calculateHeaderWidths = () => {
  const headerWidths: Record<string, number> = {}

  tableAttributes.value.forEach((tableAttribute) => {
    const headerWidth = document.getElementById(
      `${tableAttribute.name}-header`,
    )?.clientWidth

    if (!headerWidth) return

    headerWidths[tableAttribute.name] = headerWidth
  })

  storeHeaderWidths(headerWidths)
}

const initializeHeaderWidths = (storageKeyId?: string) => {
  if (storageKeyId) {
    // FIXME: This is needed because storage key as a reactive value is unsupported.
    // eslint-disable-next-line vue/no-ref-as-operand
    headerWidthsRelativeStorage = useLocalStorage<Record<string, number>>(
      storageKeyId,
      {},
    )
  }

  nextTick(() => {
    setHeaderWidths()
    calculateHeaderWidths()
  })
}

const resetHeaderWidths = () => {
  setHeaderWidths(true)
  delay(calculateHeaderWidths, 500)
}

watch(() => props.storageKeyId, initializeHeaderWidths)

watch(
  () => props.headers,
  () => initializeHeaderWidths,
)

onMounted(() => {
  if (!props.storageKeyId) return
  initializeHeaderWidths(props.storageKeyId)
})

useEventListener('resize', () => initializeHeaderWidths())

const getTooltipText = (
  item: TableAdvancedItem,
  tableAttribute: TableAttribute,
) => {
  return tableAttribute.headerPreferences.truncate
    ? item[tableAttribute.name]
    : undefined
}

const checkedRows = defineModel<Array<TableAdvancedItem>>('checkedRows', {
  required: false,
  default: (props: AdvancedTableProps) =>
    props.items.filter((item) => item.checked), // is not reactive by default and making it reactive causes other issues.
})

const {
  hasCheckboxId,
  allCheckboxRowsSelected,
  selectAllRowCheckboxes,
  handleCheckboxUpdate,
} = useTableCheckboxes(checkedRows, toRef(props, 'items'))

const rowHandlers = computed(() =>
  props.onClickRow || props.hasCheckboxColumn
    ? {
        'click-row': (event: TableAdvancedItem) => {
          if (props.onClickRow) props.onClickRow(event)
          if (props.hasCheckboxColumn) handleCheckboxUpdate(event)
        },
      }
    : {},
)

const localItems = computed(() => {
  return props.items.slice(0, props.maxItems)
})

const remainingItems = computed(() => {
  const itemCount =
    props.totalItems >= props.maxItems ? props.maxItems : props.totalItems

  return itemCount - localItems.value.length
})

const sort = (column: string) => {
  const newDirection =
    props.orderBy === column &&
    props.orderDirection === EnumOrderDirection.Ascending
      ? EnumOrderDirection.Descending
      : EnumOrderDirection.Ascending

  emit('sort', column, newDirection)
}

const isSorted = (column: string) => props.orderBy === column

const sortIcon = computed(() =>
  props.orderDirection === EnumOrderDirection.Ascending
    ? 'arrow-up-short'
    : 'arrow-down-short',
)

let currentGroupByValueIndex = -1

const groupByAttribute = computed(() => {
  if (!props.groupBy) return null

  // Try to find matching attribute from both sources
  const localAttribute = findAttribute(
    props.groupBy,
    localAttributesLookup.value,
  )
  const objectAttribute = objectAttributesLookup?.value
    ? findAttribute(props.groupBy, objectAttributesLookup.value)
    : null

  return (localAttribute || objectAttribute) as TableAttribute
})
const groupByAttributeItemName = computed(() => {
  if (!groupByAttribute.value) return

  return (
    groupByAttribute.value.dataOption?.belongs_to || groupByAttribute.value.name
  )
})

const groupByRowCounts = computed(() => {
  if (!groupByAttribute.value || !groupByAttributeItemName.value) return

  const name = groupByAttributeItemName.value
  const isRelation = Boolean(groupByAttribute.value.dataOption?.relation)

  let groupByValueIndex = 0
  let lastValue: string | number

  return localItems.value.reduce((groupByRowIds: string[][], item) => {
    const value = (isRelation ? (item[name] as ObjectLike).id : item[name]) as
      | string
      | number

    if (lastValue && value !== lastValue) {
      groupByValueIndex += 1
    }

    groupByRowIds[groupByValueIndex] ||= []
    groupByRowIds[groupByValueIndex].push(item.id)

    lastValue = value

    return groupByRowIds
  }, [])
})

const showGroupByRow = (item: TableAdvancedItem) => {
  if (!groupByAttribute.value || !groupByRowCounts.value) return false

  // Reset the current group by value when it's the first item again.
  if (item.id === localItems.value[0].id) {
    currentGroupByValueIndex = -1
  }

  const show = Boolean(
    currentGroupByValueIndex === -1 ||
      !groupByRowCounts.value[currentGroupByValueIndex].includes(item.id),
  )

  // Remember current group index, when it should be shown.
  if (show) {
    currentGroupByValueIndex += 1
  }

  return show
}

const hasLoadedMore = ref(false)

const { isLoading } = useInfiniteScroll(
  toRef(props, 'scrollContainer'),
  async () => {
    hasLoadedMore.value = true
    await props.onLoadMore?.()
  },
  {
    distance: 100,
    canLoadMore: () => remainingItems.value > 0,
  },
)

const { debouncedLoading } = useDebouncedLoading({ isLoading })

whenever(
  isLoading,
  () => {
    hasLoadedMore.value = true
  },
  { once: true },
)

const endOfListMessage = computed(() => {
  if (!hasLoadedMore.value) return ''
  if (remainingItems.value !== 0) return ''

  if (props.totalItems > props.maxItems) {
    return i18n.t(
      'You reached the table limit of %s tickets (%s remaining).',
      props.maxItems,
      props.totalItems - localItems.value.length,
    )
  }

  return i18n.t("You don't have more tickets to load.")
})

const getLinkColorClasses = (item: TableAdvancedItem) => {
  if (props.object !== EnumObjectManagerObjects.Ticket) return ''

  switch ((item as TicketById).priority?.uiColor) {
    case 'high-priority':
      return 'text-red-500 dark:text-red-500'
    case 'low-priority':
      return 'text-stone-200 dark:text-neutral-500'
    default:
      return ''
  }
}
</script>

<template>
  <table v-bind="$attrs" ref="table" class="relative table-fixed pb-3">
    <TableCaption :show="showCaption">{{ caption }}</TableCaption>

    <thead
      class="sticky top-0 z-10 bg-neutral-50 dark:bg-gray-500"
      :class="{ 'border-shadow-b': !reachedScrollTop }"
    >
      <tr>
        <th
          v-for="(tableAttribute, index) in tableAttributes"
          :id="`${tableAttribute.name}-header`"
          :key="tableAttribute.name"
          class="relative h-10 p-2.5 text-xs"
          :class="[
            tableAttribute.headerPreferences.headerClass,
            cellAlignmentClasses[
              tableAttribute.columnPreferences.alignContent || 'left'
            ],
          ]"
        >
          <!-- TODO: Implement with bulk edit -->
          <FormKit
            v-if="hasCheckboxColumn && tableAttribute.name === 'checkbox'"
            name="checkbox-all-rows"
            :aria-label="
              allCheckboxRowsSelected
                ? $t('Deselect all entries')
                : $t('Select all entries')
            "
            type="checkbox"
            :model-value="allCheckboxRowsSelected"
            @update:model-value="selectAllRowCheckboxes"
          />

          <template v-else>
            <slot
              :name="`column-header-${tableAttribute.name}`"
              :attribute="tableAttribute"
            >
              <CommonLabel
                class="-:font-normal -:text-gray-100 -:dark:text-neutral-400 block select-none truncate"
                :class="[
                  cellAlignmentClasses[
                    tableAttribute.columnPreferences.alignContent || 'left'
                  ],
                  tableAttribute.headerPreferences.labelClass || '',
                  {
                    'sr-only': tableAttribute.headerPreferences.hideLabel,
                    'text-black dark:text-white': isSorted(tableAttribute.name),
                    'hover:cursor-pointer hover:text-black focus-visible:rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-blue-800 dark:hover:text-white':
                      !tableAttribute.headerPreferences.noSorting,
                  },
                ]"
                :aria-label="
                  orderDirection === EnumOrderDirection.Ascending
                    ? $t('Sorted ascending')
                    : $t('Sorted descending')
                "
                :role="
                  tableAttribute.headerPreferences.noSorting
                    ? undefined
                    : 'button'
                "
                :tabindex="
                  tableAttribute.headerPreferences.noSorting ? undefined : '0'
                "
                size="small"
                @click="
                  tableAttribute.headerPreferences.noSorting
                    ? undefined
                    : sort(tableAttribute.name)
                "
                @keydown.enter.prevent="
                  tableAttribute.headerPreferences.noSorting
                    ? undefined
                    : sort(tableAttribute.name)
                "
                @keydown.space.prevent="
                  tableAttribute.headerPreferences.noSorting
                    ? undefined
                    : sort(tableAttribute.name)
                "
              >
                {{
                  $t(
                    tableAttribute.label,
                    ...(tableAttribute.labelPlaceholder || []),
                  )
                }}
                <CommonIcon
                  v-if="
                    !tableAttribute.headerPreferences.noSorting &&
                    isSorted(tableAttribute.name)
                  "
                  class="inline text-blue-800"
                  :name="sortIcon"
                  size="xs"
                  decorative
                />
              </CommonLabel>
            </slot>
          </template>

          <slot
            :name="`header-suffix-${tableAttribute.name}`"
            :item="tableAttribute"
          />

          <HeaderResizeLine
            v-if="
              !tableAttribute.headerPreferences.noResize &&
              index !== tableAttributes.length - 1
            "
            @resize="calculateHeaderWidths"
            @reset="resetHeaderWidths"
          />
        </th>
        <th v-if="actions" class="h-10 w-0 p-2.5 text-center">
          <CommonLabel
            class="font-normal text-stone-200 dark:text-neutral-500"
            size="small"
            >{{ $t('Actions') }}
          </CommonLabel>
        </th>
      </tr>
    </thead>
    <!--    :TODO tabindex should be -1 re-evaluate when we work on bulk action with checkbox  -->
    <!--    SR should not be able to focus the row but each action node  -->
    <tbody>
      <template v-for="item in localItems" :key="item.id">
        <TableRowGroupBy
          v-if="groupByAttribute && showGroupByRow(item)"
          ref=""
          :item="item"
          :attribute="groupByAttribute"
          :table-column-length="tableColumnLength"
          :group-by-value-index="currentGroupByValueIndex"
          :group-by-row-counts="groupByRowCounts"
          :remaining-items="remainingItems"
        />
        <TableRow
          :item="item"
          :is-row-selected="
            !hasCheckboxColumn && item.id === props.selectedRowId
          "
          tabindex="-1"
          :has-checkbox="hasCheckboxColumn"
          :with-even-stripes="!!groupByAttribute"
          v-on="rowHandlers"
        >
          <template #default="{ isRowSelected }">
            <td
              v-for="tableAttribute in tableAttributes"
              :key="`${item.id}-${tableAttribute.name}`"
              class="h-10 p-2.5 text-sm"
              :class="[
                cellAlignmentClasses[
                  tableAttribute.columnPreferences.alignContent || 'left'
                ],
                {
                  'max-w-32 truncate text-black dark:text-white':
                    tableAttribute.headerPreferences.truncate,
                },
              ]"
            >
              <FormKit
                v-if="hasCheckboxColumn && tableAttribute.name === 'checkbox'"
                :key="`checkbox-${item.id}-${tableAttribute.name}`"
                :name="`checkbox-${item.id}`"
                :aria-label="
                  hasCheckboxId(item.id)
                    ? $t('Deselect this entry')
                    : $t('Select this entry')
                "
                type="checkbox"
                :alternative-background="true"
                :classes="{
                  decorator:
                    'group-active:formkit-checked:border-white group-hover:dark:border-white group-hover:group-active:border-white group-hover:group-active:peer-hover:border-white group-hover:formkit-checked:border-black group-hover:dark:formkit-checked:border-white group-hover:dark:peer-hover:border-white  ltr:group-hover:dark:group-hover:peer-hover:formkit-checked:border-white ltr:group-hover:peer-hover:dark:border-white rtl:group-hover:peer-hover:dark:border-white ltr:group-hover:peer-hover:border-black rtl:group-hover:peer-hover:border-black  group-hover:border-black',
                  decoratorIcon:
                    'group-active:formkit-checked:text-white group-hover:formkit-checked:text-black group-hover:formkit-checked:dark:text-white',
                }"
                :disabled="!!item.disabled"
                :model-value="hasCheckboxId(item.id)"
                @click="handleCheckboxUpdate(item)"
                @keydown.enter="handleCheckboxUpdate(item)"
                @keydown.space="handleCheckboxUpdate(item)"
              />
              <template v-else>
                <slot
                  :name="`column-cell-${tableAttribute.name}`"
                  :item="item"
                  :is-row-selected="isRowSelected"
                  :attribute="tableAttribute"
                >
                  <CommonLink
                    v-if="tableAttribute.columnPreferences.link"
                    v-tooltip.truncate="getTooltipText(item, tableAttribute)"
                    :link="
                      tableAttribute.columnPreferences.link.getLink(
                        item,
                        tableAttribute,
                      )
                    "
                    :open-in-new-tab="
                      tableAttribute.columnPreferences.link.openInNewTab
                    "
                    :internal="tableAttribute.columnPreferences.link.internal"
                    :class="[
                      {
                        'text-black dark:text-white': isRowSelected,
                      },
                      getLinkColorClasses(item),
                    ]"
                    class="block truncate text-sm hover:no-underline group-hover:text-black group-focus-visible:text-white group-active:text-white group-hover:dark:text-white"
                    @click.stop
                    @keydown.stop
                  >
                    <ObjectAttributeContent
                      mode="table"
                      :attribute="tableAttribute as unknown as ObjectAttribute"
                      :object="item"
                    />
                  </CommonLink>
                  <CommonLabel
                    v-else
                    v-tooltip.truncate="getTooltipText(item, tableAttribute)"
                    class="-:text-gray-100 -:dark:text-neutral-400 block truncate group-hover:text-black group-focus-visible:text-white group-active:text-white group-hover:dark:text-white"
                    :class="[
                      {
                        'text-black dark:text-white': isRowSelected,
                      },
                    ]"
                  >
                    <ObjectAttributeContent
                      mode="table"
                      :attribute="tableAttribute as unknown as ObjectAttribute"
                      :object="item"
                    />
                  </CommonLabel>
                </slot>

                <slot
                  :name="`item-suffix-${tableAttribute.name}`"
                  :item="item"
                />
              </template>
            </td>
            <td v-if="actions" class="h-10 p-2.5 text-center">
              <slot name="actions" v-bind="{ actions, item }">
                <CommonActionMenu
                  class="flex items-center justify-center"
                  :actions="actions"
                  :entity="item"
                  button-size="medium"
                />
              </slot>
            </td>
          </template>
        </TableRow>
      </template>

      <Transition leave-active-class="absolute">
        <div
          v-if="debouncedLoading"
          :class="{ 'pt-10': localItems.length % 2 !== 0 }"
          class="absolute w-full pb-4"
        >
          <CommonTableRowsSkeleton :rows="3" />
        </div>
      </Transition>
    </tbody>
  </table>
  <CommonLabel
    v-if="endOfListMessage"
    class="py-2.5 text-stone-200 dark:text-neutral-500"
    size="small"
  >
    {{ endOfListMessage }}
  </CommonLabel>
</template>

<style scoped>
[data-theme='dark'] .border-shadow-b {
  box-shadow: 0 1px 0 0 theme('colors.gray.900');
}

.border-shadow-b {
  box-shadow: 0 1px 0 0 theme('colors.neutral.100');
}
</style>

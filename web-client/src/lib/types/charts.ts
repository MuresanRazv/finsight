import { FilterDefinition } from './article'

export interface ChartDataResponse {
    chartId?: string
    title?: string
    description?: string
    available_filters?: FilterDefinition[]
    data?: unknown
}

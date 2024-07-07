export interface MenuItem {
  component?: string
  hidden?: boolean
  name?: string
  path?: string
  meta?: {
    icon?: string
    link?: null
    noCache?: boolean
    title?: string
  }
  children?: MenuItem[]
  alwaysShow?: boolean
  redirect?: string
}

export interface RawItem {
  component?: string
  visible: string | number
  path?: string
  icon?: string
  isCache: number
  menuName?: string
  id?: string | number
  pid?: string | number
  menuType: string
  isFrame?: number
}

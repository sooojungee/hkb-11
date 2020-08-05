import { Component } from './components'
import { View } from './components/view'
import { Observable } from './model'
import store from './model/store'
import { GLOBAL, ROUTER } from './utils/constants'

class Router extends Observable {
  url: URL
  year: number
  month: number
  currentPath: string
  components: Map<string, Component<View>[]>
  constructor() {
    super()
    this.components = new Map<string, Component<View>[]>()
    this.year = new Date().getFullYear()
    this.month = new Date().getMonth() + 1

    store.on(GLOBAL.LOGIN, () => {
      this.go('list')
    })
    store.on(GLOBAL.LOGOUT, () => {
      this.go('login')
    })

    document.body.addEventListener('click', ({ target }) => {
      if (target instanceof HTMLAnchorElement) {
        const to = target.getAttribute('to')
        if (!to) return
        this.go(to)
      }
    })
    window.onpopstate = (event) => {
      const { state } = event
      console.log(state)
      const { path, year, month } = state
      if (path !== 'login') {
        this.year = year
        this.month = month
        this.commitDateChange()
      }
      this.go(path, true)
    }
  }
  add(path: string, components: Component<View>[]) {
    this.components[path] = components
  }
  getURL() {
    this.url = new URL(window.location.href)
  }
  parseURL() {
    this.getURL()
    const path = this.url.pathname.substr(1)
    const year = parseInt(this.url.searchParams.get('year'))
    const month = parseInt(this.url.searchParams.get('month'))

    if (!(this.year === year && this.month === month) && year && month) {
      this.year = year
      this.month = month
    }
    this.commitDateChange()
    if (path === '') {
      if (store.id) {
        this.go('list')
        return
      }
      this.go('login')
      return
    }
    if (!this.isInvalidPath(path)) this.go(path)
  }
  commitDateChange() {
    this.emit(ROUTER.CHANGE_DATE, { year: this.year, month: this.month })
  }
  pushURL() {
    const { currentPath, year, month } = this
    if (currentPath === 'login') {
      history.pushState({ path: 'login' }, '', 'login')
      return
    }
    const params = `year=${year}&month=${month}`
    history.pushState(
      { path: currentPath, year, month },
      '',
      `${currentPath}?${params}`
    )
  }
  movePreviousMonth() {
    if (this.month == 1) {
      this.year -= 1
      this.month = 12
    } else this.month -= 1
    this.commitDateChange()
  }
  moveNextMonth() {
    if (this.month == 12) {
      this.year += 1
      this.month = 1
    } else this.month += 1
    this.commitDateChange()
  }
  isInvalidPath(path) {
    return !Object.keys(this.components).includes(path)
  }
  go(path, fromPopState = false) {
    if (path === 'previous-month') {
      this.movePreviousMonth()
    } else if (path === 'next-month') {
      this.moveNextMonth()
    } else if (this.currentPath !== path) {
      if (this.isInvalidPath(path)) return
      if (this.currentPath) {
        this.emit(ROUTER.MUTATE_VIEW, {
          path: this.currentPath,
          flag: false,
          components: this.components[this.currentPath],
        })
        if (this.currentPath === 'login') {
          this.commitDateChange()
        }
      }
      this.emit(ROUTER.MUTATE_VIEW, {
        path,
        flag: true,
        components: this.components[path],
      })
      this.currentPath = path
    }
    if (fromPopState) this.pushURL()
    return this.components[path]
  }

  getYear() {
    return this.year
  }
  getMonth() {
    return this.month
  }
}

const router = new Router()

export default router

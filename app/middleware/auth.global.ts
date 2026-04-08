export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  const publicPaths = ['/login', '/register']

  if (!loggedIn.value && !publicPaths.includes(to.path)) {
    return navigateTo('/login')
  }

  if (loggedIn.value && publicPaths.includes(to.path)) {
    return navigateTo('/')
  }

  // Protect /admin routes — sales role cannot access
  if (loggedIn.value && to.path.startsWith('/admin')) {
    const role = (user.value as { role?: string } | null)?.role
    if (role !== 'admin') {
      return navigateTo('/')
    }
  }
})

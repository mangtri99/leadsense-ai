export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  const publicPaths = ['/login', '/register']

  if (!loggedIn.value && !publicPaths.includes(to.path)) {
    return navigateTo('/login')
  }

  if (loggedIn.value && publicPaths.includes(to.path)) {
    return navigateTo('/')
  }
})

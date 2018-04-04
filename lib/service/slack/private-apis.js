function extend(rtm) {
  const client = rtm.webClient
  client.users.counts = client.apiCall.bind(client, 'users.counts')
  client.users.badgeCount = client.apiCall.bind(client, 'users.badgeCount')
  client.auth.findTeam = client.apiCall.bind(client, 'auth.findTeam')
  client.auth.findUser = client.apiCall.bind(client, 'auth.findUser')
  client.auth.signin = client.apiCall.bind(client, 'auth.signin')
  client.auth.signout = client.apiCall.bind(client, 'auth.signout')
}

module.exports = {extend}

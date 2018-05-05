function extend(rtm) {
  const client = rtm.webClient ? rtm.webClient : rtm
  client.requestQueue._concurrency = 10
  client.bots.list = client.apiCall.bind(client, 'bots.list')
  client.conversations.mark = client.apiCall.bind(client, 'conversations.mark')
  client.users.counts = client.apiCall.bind(client, 'users.counts')
  client.users.badgeCount = client.apiCall.bind(client, 'users.badgeCount')
  client.auth.findTeam = client.apiCall.bind(client, 'auth.findTeam')
  client.auth.findUser = client.apiCall.bind(client, 'auth.findUser')
  client.auth.signin = client.apiCall.bind(client, 'auth.signin')
  client.auth.signout = client.apiCall.bind(client, 'auth.signout')
  // Raise concurrency limitation higher.
  client.requestQueue._concurrency = 10
}

module.exports = {extend}

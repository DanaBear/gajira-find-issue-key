const _ = require('lodash')
const Jira = require('./common/net/Jira')

const issueIdRegEx = /([a-zA-Z0-9]+-[0-9]+)/g

const eventTemplates = {
  branch: '{{event.ref}}',
  commits: "{{event.commits.map(c=>c.message).join(' ')}}",
}

module.exports = class {
  constructor ({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    console.log("config " + this.config)
    this.argv = argv
    console.log("argv " + this.argv)
    this.githubEvent = githubEvent
    console.log("githubEvent " + this.githubEvent)
  }

  async execute () {
    console.log("this.argv.from  " + this.argv.from)
    console.log("this.argv._.join(' ')  " + this.argv._.join(' '))
    const template = eventTemplates[this.argv.from] || this.argv._.join(' ')
    console.log("template " + template)
    const extractString = this.preprocessString(template)
    console.log("extractString " + extractString)
    const match = extractString.match(issueIdRegEx)
    console.log("match " + match)

    if (!match) {
      console.log(`String "${extractString}" does not contain issueKeys`)

      return
    }

    for (const issueKey of match) {
      const issue = await this.Jira.getIssue(issueKey)
      console.log("issue " + issue)
      
      if (issue) {
        return { issue: issue.key }
      }
    }
  }

  preprocessString (str) {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g
    const tmpl = _.template(str)
    console.log("tmpl inside " + tmpl)
    console.log("githubEvent inside " + this.githubEvent)  
    return tmpl({ event: this.githubEvent })
  }
}

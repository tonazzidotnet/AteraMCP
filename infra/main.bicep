targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment (e.g., dev, prod)')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@secure()
@description('Atera API key')
param ateraApiKey string

var abbrs = loadJsonContent('abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = {
  'azd-env-name': environmentName
}

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: '${abbrs.resourceGroup}${environmentName}'
  location: location
  tags: tags
}

module api 'app/api.bicep' = {
  name: 'api'
  scope: rg
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    ateraApiKey: ateraApiKey
  }
}

output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_FUNCTION_NAME string = api.outputs.functionAppName
output API_URI string = api.outputs.functionAppUrl

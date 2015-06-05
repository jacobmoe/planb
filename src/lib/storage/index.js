import path from 'path'

import projects from './projects'
import endpoints from './endpoints'
import versions from './versions'

import packageJson from '../../../package'

function getDataDirName(name) {
  let _dataDirName = '.' + name + '.d'

  if (process.env.NODE_ENV === 'test') {
    _dataDirName = _dataDirName + '.test'
  }

  return _dataDirName
}

export const dataDirName = getDataDirName(packageJson.name)

export default function (projectPath) {

  const storagePath = path.join(projectPath, dataDirName)

  return {
    projects: projects(storagePath),
    endpoints: endpoints(storagePath),
    versions: versions
  }

}

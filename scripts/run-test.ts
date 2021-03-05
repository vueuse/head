import execa from 'execa'
import fetch from 'node-fetch'

const args = process.argv.slice(2)

const cmd = execa('npm', ['run', 'example'])

cmd.stdout!.pipe(process.stdout)
cmd.stderr!.pipe(process.stderr)

const tryRun = () => {
  setTimeout(() => {
    fetch(`http://localhost:3000`)
      .then((res) => {
        if (res.ok) {
          const test = execa('npm', ['run', 'test:e2e', '--', ...args], {
            stdio: 'inherit',
          })
          test.on('exit', (code) => {
            process.exit(code || 0)
          })
        } else {
          tryRun()
        }
      })
      .catch(tryRun)
  }, 200)
}

tryRun()

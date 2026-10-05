const { spawn } = require('child_process');

const packagePath = '/piston/packages/python/3.12.0';
const containerRunPath = '/piston/test_run';
const filename = 'temp_test.py';

const runCmd = `cd ${packagePath} && . ./environment && cd ${containerRunPath} && bash ${packagePath}/run ${filename}`;

console.log('Spawning process...');
const activeProcess = spawn('docker', ['exec', '-i', 'piston_api', 'sh', '-c', runCmd]);

activeProcess.stdout.on('data', (data) => {
    console.log('[STDOUT]:', data.toString());
});

activeProcess.stderr.on('data', (data) => {
    console.log('[STDERR]:', data.toString());
});

activeProcess.on('close', (code) => {
    console.log('Process exited with code:', code);
});

setTimeout(() => {
    console.log('Sending input...');
    activeProcess.stdin.write('Bob\n');
}, 3000);

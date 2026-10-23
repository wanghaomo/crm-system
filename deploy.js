import { spawn } from 'child_process';
import { createInterface } from 'readline';
import dayjs from 'dayjs';
import { Client } from 'ssh2';
import { readdir, createReadStream } from 'fs';
import { join } from 'path';

/** 创建命令行交互接口 */
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

const WORK_DIR = '/work/frontend';

/** 配置远程服务器信息 - 请根据实际情况修改 */
const REMOTE_SERVER = {
    // 远程服务器用户名
    username: 'root',
    // 远程服务器地址——根据正式环境修改
    host: '115.190.97.25',
    // 远程服务器密码——根据正式环境修改
    password: "_aI{)u[UY3E1^sn'lYxRJ89wgkgM7yvf",
    // 远程服务器端口
    port: 22,
    // 本地文件地址
    localDir: './dist',
    // 远程服务器目标部署目录——（iotdata）根据正式环境修改
    // 需要全局搜索iotdata并且替换为正式环境的域名
    targetPath: WORK_DIR + '/crm/dist',
};

/** 执行命令的函数 */
function runCommand(command, args = [], options = {}) {
    // 在Windows上使用npm.cmd而不是npm
    if (process.platform === 'win32' && command === 'npm') {
        command = 'npm.cmd';
    }

    return new Promise((resolve, reject) => {
        console.log(`执行命令: ${command} ${args.join(' ')}`);
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: process.platform === 'win32', // 在Windows上启用shell
            ...options,
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`命令 ${command} 执行失败，退出码: ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`命令 ${command} 启动失败: ${err.message}`));
        });
    });
}

/**
 * 封装SSH命令执行为Promise
 * @param {Object} conn - SSH连接实例
 * @param {string} command - 要执行的命令
 * @returns {Promise} - 包含命令输出和退出码的Promise
 */
function execCommand(conn, command) {
    console.log(`执行命令: ${command}`);
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        conn.exec(command, { pty: true }, (err, stream) => {
            if (err) {
                return reject(new Error(`命令执行失败: ${err.message}`));
            }

            // 收集标准输出
            stream.on('data', (data) => {
                stdout += data.toString();
            });

            // 收集错误输出
            stream.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // 命令执行结束
            stream.on('close', (code, signal) => {
                resolve({
                    code, // 退出码（0表示成功）
                    signal, // 终止信号（通常为null）
                    stdout, // 标准输出内容
                    stderr, // 错误输出内容
                });
            });

            // 处理流错误
            stream.on('error', (err) => {
                console.error(`流错误: ${err.message}`);
                reject(new Error(`流错误: ${err.message}`));
            });
        });
    });
}

/** 执行命令工具方法 */
function doCommand(conn, command, msg) {
    console.log(`执行命令: ${command}`);
    return new Promise((resolve) => {
        conn.exec(command, (err, stream) => {
            if (err) {
                console.error(err);
                resolve(1);
            } else {
                stream
                    .on('close', (code, signal) => {
                        if (code !== 0) {
                            console.error(`${msg}失败，退出码: ${code}`);
                            resolve(1);
                            return;
                        } else {
                            console.log(`${msg}成功`);
                            resolve(0);
                        }
                    })
                    .on('data', (data) => {
                        console.log(`stdout: ${data}`);
                        resolve(1);
                    })
                    .stderr.on('data', (data) => {
                        debugger;
                        console.error(`stderr: ${data}`);
                        resolve(1);
                    });
            }
        });
    });
}

/** 生成带时间戳的备份文件名 */
function getBackupDirName() {
    const date = new Date();
    return `backup_${dayjs().format('YYYY_MM_DD_HH_mm')}`;
}

/** 连接远程服务器，然后把原文件进行移动备份后，拷贝本地文件到远程服务器 */
function backupAndCopy() {
    if (!REMOTE_SERVER.targetPath || REMOTE_SERVER.targetPath === '/') {
        return Promise.reject(new Error('REMOTE_SERVER.targetPath 非法，拒绝执行'));
    }
    return new Promise((resolve) => {
        // 连接SSH服务器并执行操作
        const conn = new Client();
        conn.on('ready', async () => {
            console.log('已成功连接到远程服务器');

            conn.sftp(async (err, sftp) => {
                if (err) {
                    console.error('获取SFTP连接失败:', err);
                    conn.end();
                    process.exit(1);
                } else {
                    //移除dist目录
                    console.log('开始删除dist目录...');
                    const delResult = await execCommand(conn, `rm -rf ${REMOTE_SERVER.targetPath}/*`);
                    if (delResult.code !== 0) {
                        console.log(`清空目标目录失败: ${delResult.stderr}`);
                        process.exit(1);
                    }
                    uploadDirectory(REMOTE_SERVER.localDir, REMOTE_SERVER.targetPath, sftp, async () => {
                        //返回上一个层级，并容器部署
                        console.log('开始启动容器...');
                        const deployResult = await execCommand(
                            conn,
                            `cd ${WORK_DIR} && docker-compose up -d --build crm-frontend`
                        );
                        if (deployResult.code !== 0) {
                            console.error('容器启动失败:', deployResult.stderr);
                            process.exit(1);
                        }
                        // 检查容器状态
                        console.log('检查容器状态...');
                        const statusResult = await execCommand(conn, `cd ${WORK_DIR} && docker-compose ps`);
                        console.log('容器状态:', statusResult.stdout);

                        // 清理无用镜像
                        console.log('清理无用镜像...');
                        // await execCommand(conn, `docker image prune -f`)

                        console.log('>>>>>>>>>>>>>>>>>>>>> 执行完成');
                        process.exit(0);
                    });
                }
            });
        }).connect(REMOTE_SERVER);

        conn.on('error', (err) => {
            console.error('连接远程服务器错误错误:', err);
            resolve();
        });

        conn.on('end', () => {
            console.log('远程连接已关闭');
            resolve();
        });
    });
}

/** 文件采用ftp进行上传 */
function uploadDirectory(localPath, remotePath, sftp, callback) {
    /** 读取本地文件，并进行文件上传 */
    readdir(localPath, { withFileTypes: true }, (err, entries) => {
        if (err) {
            console.error('>>>>>>>>>>>>>>>>>>>>> 读取文件错误，原因：');
            console.error(err);
            return callback();
        }

        /** 如果文件长度不够，那么递归已经完成 */
        const total = entries.length;
        console.log('>>>>>>>>>>>>>>>>>>>>> 当前文件个数：' + total);
        if (total === 0) {
            return callback();
        }

        /**
         * 遍历文件实例
         */
        let completed = 0;
        entries.forEach((entry) => {
            const localItemPath = join(localPath, entry.name);
            const remoteItemPath = `${remotePath}/${entry.name}`;

            /**
             * 如果是文件夹，1、先创建远程子目录，2、递归上传子目录内容
             */
            if (entry.isDirectory()) {
                sftp.mkdir(remoteItemPath, (err) => {
                    /** 忽略目录已存在的错误 (code 4) */
                    if (err && err.code !== 4) {
                        console.error(`创建远程子目录失败 ${remoteItemPath}:`, err);
                        return handleCompletion();
                    }
                    /** 递归上传子目录内容 */
                    uploadDirectory(localItemPath, remoteItemPath, sftp, handleCompletion);
                });
            } else {
                /** 创建文件读取流对象，远程文件写入流对象 */
                const readStream = createReadStream(localItemPath);
                const writeStream = sftp.createWriteStream(remoteItemPath);
                console.log(`上传中: ${localItemPath} -> ${remoteItemPath}`);
                writeStream.on('close', () => {
                    console.log(`上传完成: ${localItemPath}`);
                    handleCompletion();
                });
                writeStream.on('error', (err) => {
                    console.error(`上传失败 ${localItemPath}:`, err);
                    handleCompletion();
                });
                readStream.pipe(writeStream);
            }
        });

        function handleCompletion() {
            completed++;
            if (completed === total) {
                callback();
            }
        }
    });
}

/** 主要执行函数 */
(async function main() {
    try {
        // 获取提交信息
        // const commitMessage = await new Promise((resolve) => {
        //     rl.question('请输入提交信息: ', (answer) => {
        //         resolve(answer.trim() || '自动提交');
        //     });
        // });

        // 1. 执行Git相关操作
        console.log('\n===== 开始Git操作 =====');
        // await runCommand('git', ['add', '.']);
        // await runCommand('git', ['commit', '-m', commitMessage]);
        // await runCommand('git', ['pull']);
        // await runCommand('git', ['push']);

        // 2. 执行构建
        console.log('\n===== 开始项目构建 =====');
        await runCommand('npm', ['run', 'build:test']);

        // 3. 连接远程服务器，然后把原文件进行移动备份后，拷贝本地文件到远程服务器
        await backupAndCopy();

        console.log('\n所有操作执行成功！');
    } catch (error) {
        console.error(`\n操作失败: ${error.message}`);
        process.exit(1);
    } finally {
        rl.close();
    }
})();

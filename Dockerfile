# 使用官方 Nginx 镜像（已包含 Nginx 服务）
FROM nginx:1.25-alpine

# 复制本地构建好的 dist 目录到 Nginx 的默认静态资源目录
COPY dist/ /usr/share/nginx/html/

# 先删除默认配置
RUN rm -rf /etc/nginx/conf.d/default.conf

# 可选：替换 Nginx 配置文件（如需自定义反向代理等）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 9400 端口
EXPOSE 8210

# 启动 Nginx 服务
CMD ["nginx", "-g", "daemon off;"]

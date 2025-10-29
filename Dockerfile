FROM rust:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    file \
    build-essential \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libwebkit2gtk-4.1-dev \
    gcc-mingw-w64-x86-64 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Rust target for Windows
RUN rustup target add x86_64-pc-windows-gnu

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy all source files
COPY . .

# Build command (can be overridden)
CMD ["npm", "run", "tauri:build"]

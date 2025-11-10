# Use the official PostgreSQL 15 image as a base
FROM postgres:15

# Install build dependencies, git, and PostgreSQL development headers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    postgresql-server-dev-15 \
 && rm -rf /var/lib/apt/lists/*

# Clone the pgvector repository
RUN git clone --branch v0.5.0 https://github.com/pgvector/pgvector.git /usr/src/pgvector

# Build and install the pgvector extension
RUN cd /usr/src/pgvector && make && make install

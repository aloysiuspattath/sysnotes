import os
import sys
import datetime
import subprocess

def generate_with_cryptography(cert_path, key_path):
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization

    # Generate key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    # Generate cert
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"SysNotes Dev"),
    ])
    
    now = datetime.datetime.utcnow()
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        now - datetime.timedelta(days=1)
    ).not_valid_after(
        now + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([
            x509.DNSName(u"localhost"),
            x509.DNSName(u"127.0.0.1"),
        ]),
        critical=False,
    ).sign(private_key, hashes.SHA256())

    # Write key
    with open(key_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ))

    # Write cert
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    print(f"Success: Generated SSL key/cert using cryptography library.")
    print(f"  Key:  {os.path.abspath(key_path)}")
    print(f"  Cert: {os.path.abspath(cert_path)}")

def generate_with_openssl(cert_path, key_path):
    print("Cryptography library not found. Falling back to openssl CLI tool...")
    cmd = [
        "openssl", "req", "-x509", "-newkey", "rsa:2048", 
        "-keyout", key_path, "-out", cert_path, 
        "-days", "365", "-nodes", 
        "-subj", "/CN=localhost/O=SysNotes Dev"
    ]
    try:
        subprocess.run(cmd, check=True)
        print(f"Success: Generated SSL key/cert using OpenSSL command-line CLI.")
        print(f"  Key:  {os.path.abspath(key_path)}")
        print(f"  Cert: {os.path.abspath(cert_path)}")
    except Exception as e:
        print(f"Error: OpenSSL fallback failed: {e}")
        print("Please install cryptography module ('pip install cryptography') or make sure openssl is in your PATH.")
        sys.exit(1)

def main():
    cert_path = "cert.pem"
    key_path = "key.pem"
    
    try:
        import cryptography
        generate_with_cryptography(cert_path, key_path)
    except ImportError:
        generate_with_openssl(cert_path, key_path)

if __name__ == '__main__':
    main()

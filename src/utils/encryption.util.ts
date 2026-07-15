import * as crypto from 'crypto';

/**
 * AES-256-CBC encryption utility for PCI-compliant card storage.
 *
 * Usage:
 *   const masked  = EncryptionUtil.maskCardNumber('3528', 'visa');
 *   // → "**** **** **** 3528"
 *
 *   const stored  = EncryptionUtil.encrypt(masked);   // save this to DB
 *   const display = EncryptionUtil.decrypt(stored);   // "**** **** **** 3528"
 *
 * The raw key MUST be set in the ENCRYPTION_KEY environment variable (32+ chars).
 */
export class EncryptionUtil {
    private static readonly ALGORITHM = 'aes-256-cbc';
    private static readonly IV_LENGTH = 16; // bytes

    /** Returns exactly 32-byte key buffer from env var */
    private static getKey(): Buffer {
        const raw = process.env.ENCRYPTION_KEY ?? '';
        if (!raw) {
            throw new Error(
                '[EncryptionUtil] ENCRYPTION_KEY env var is not set. ' +
                'Add a 32-character secret key to your .env file.',
            );
        }
        // Pad or truncate to exactly 32 bytes
        const padded = raw.padEnd(32, '0').substring(0, 32);
        return Buffer.from(padded, 'utf8');
    }

    /**
     * Encrypts a plain-text string with AES-256-CBC.
     * Stored format: `<hex-iv>:<hex-ciphertext>`
     */
    static encrypt(text: string): string {
        if (!text) return text;
        try {
            const iv = crypto.randomBytes(this.IV_LENGTH);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cipher = (crypto as any).createCipheriv(
                this.ALGORITHM,
                this.getKey(),
                iv,
            );
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return `${iv.toString('hex')}:${encrypted}`;
        } catch (e) {
            console.error('[EncryptionUtil] Encryption failed:', e);
            return text;
        }
    }

    /**
     * Decrypts an AES-256-CBC string produced by `encrypt()`.
     */
    static decrypt(encryptedText: string): string {
        if (!encryptedText || !encryptedText.includes(':')) {
            return encryptedText; // not encrypted — return as-is
        }
        try {
            const [ivHex, cipherHex] = encryptedText.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decipher = (crypto as any).createDecipheriv(
                this.ALGORITHM,
                this.getKey(),
                iv,
            );
            let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            console.error('[EncryptionUtil] Decryption failed:', e);
            return encryptedText;
        }
    }

    /**
     * Builds the masked card string shown to users.
     * @param last4   Last 4 digits from Stripe (e.g. "3528")
     * @param brand   Card brand from Stripe (e.g. "visa")
     * @returns       e.g.  "**** **** **** 3528"
     */
    static maskCardNumber(last4: string, brand?: string): string {
        return `**** **** **** ${last4}`;
    }
}

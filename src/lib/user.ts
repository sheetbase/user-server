import { uniqueId } from '@sheetbase/core-server';

import { DatabaseDriver, UserData, UserInfo, UserProfile, OobMode } from './types';
import { sha256 } from './utils';
import { TokenService } from './token';

export class User {

    private userData: UserData;
    private Database: DatabaseDriver;
    private Token: TokenService;

    constructor(
        userData: UserData,
        Database: DatabaseDriver,
        Token: TokenService,
    ) {
        this.userData = userData;
        this.Database = Database;
        this.Token = Token;
    }

    getData() {
        return this.userData;
    }

    getInfo(): UserInfo {
        const {
            '#': id,
            uid,
            providerId,
            providerData = null,
            email = '',
            emailVerified = false,
            createdAt = 0,
            lastLogin = 0,
            username = '',
            phoneNumber = '',
            displayName = '',
            photoURL = '',
            claims = {},
        } = this.userData;
        return {
            '#': id, uid, providerId, providerData,
            email, emailVerified,
            createdAt, lastLogin,
            username, phoneNumber,
            displayName, photoURL,
            claims,
        };
    }

    getIdToken() {
        return this.Token.signIdToken(this.userData);
    }

    comparePassword(password: string) {
        const { uid = '', password: currentPasswordSecure } = this.userData;
        const passwordSecure = sha256(uid + password);
        return passwordSecure === currentPasswordSecure;
    }

    getProvider() {
        const { providerId, providerData } = this.userData;
        return { providerId, providerData };
    }

    updateProfile(data: UserProfile): User {
        const allowedFields = [ 'displayName', 'photoURL' ];
        const profile = {};
        for (let i = 0; i < allowedFields.length; i++) {
            const field = allowedFields[i];
            if (!!data[field]) {
                profile[field] = data[field];
            }
        }
        // apply
        this.userData = { ... this.userData, ... profile };
        return this;
    }

    updateClaims(claims: {[key: string]: any}): User {
        this.userData.claims = { ... this.userData.claims, ... claims };
        return this;
    }

    setProviderData(data: any): User {
        this.userData.providerData = data;
        return this;
    }

    setlastLogin(): User {
        this.userData.lastLogin = (new Date()).getTime();
        return this;
    }

    setEmail(email: string): User {
        this.userData.email = email;
        return this;
    }

    confirmEmail(): User {
        this.userData.emailVerified = true;
        return this;
    }

    setPassword(password: string): User {
        // TODO: implement bcrypt
        const { uid = '' } = this.userData;
        this.userData.password = sha256(uid + password);
        return this;
    }

    setUsername(username: string): User {
        this.userData.username = username;
        return this;
    }

    setPhoneNumber(phoneNumber: string): User {
        this.userData.phoneNumber = phoneNumber;
        return this;
    }

    setOob(mode: OobMode = 'none'): User {
        const { uid } = this.userData;
        const modes = ['resetPassword', 'verifyEmail']; // valid modes
        this.userData.oobCode = sha256(uid + Utilities.getUuid());
        this.userData.oobMode = !!modes[mode] ? mode : 'none';
        this.userData.oobTimestamp = (new Date()).getTime();
        return this;
    }

    setRefreshToken(): User {
        this.userData.refreshToken = uniqueId(64, 'A');
        this.userData.tokenTimestamp = (new Date()).getTime();
        return this;
    }

    delete(): User {
        const { '#': id } = this.userData;
        this.Database.deleteUser(id);
        return this;
    }

    save(): User {
        const { '#': id } = this.userData;
        this.Database.updateUser(id, this.userData);
        return this;
    }

}

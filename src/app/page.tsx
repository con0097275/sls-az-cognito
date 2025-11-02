'use client';

import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { post } from 'aws-amplify/api';

// v6 modular APIs
import {
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { get } from 'aws-amplify/api';

// ✅ Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-west-1_6exKqFjIB',
      userPoolClientId: '5ssfn21p5o2uprdmoicomu807b',
      loginWith: { email: true, username: false, phone: false },
    },
  },
  API: {
    REST: {
      myApi: {
        endpoint: 'https://h18h1m5as0.execute-api.us-west-1.amazonaws.com/dev',
        region: 'us-west-1',
      },
    },
  },
});

export default function Page() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        setEmail(attrs.email ?? null);
        setName(attrs.name ?? null);
      } catch {
        // not signed in yet
      }
    })();
  }, []);

  const getUserData = async () => {
    try {
      const user = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      const session = await fetchAuthSession();

      const idToken = session.tokens?.idToken?.toString();
      const accessToken = session.tokens?.accessToken?.toString();
      // const refreshToken = session.tokens?.refreshToken?.toString();
       // payload gửi lên API
      const payload = {
        email: attrs.email ?? user?.signInDetails?.loginId ?? user?.username ?? '',
        name:  attrs.name  ?? '',
        age:   18, // ví dụ thêm field khác
      };


      // ✅ call API Gateway via modular client
      const { body } = await post({
        apiName: 'myApi',
        path: '/hello',
        options: {
          headers: { Authorization: idToken },
          body: payload
        },
      }).response;
      const data = await body.json();

      console.log('✅ API Response:', data);
      console.log('✅ Cognito User:', user);
      console.log('✅ Attributes:', attrs);
      console.log('✅ ID Token:', idToken);
      console.log('✅ Access Token:', accessToken);
      // console.log('✅ Refresh Token:', refreshToken);

      alert(`Logged in as ${attrs.email}\n\nID token (truncated): ${idToken?.slice(0, 40)}...`);
    } catch (e) {
      console.error('Error getting user data:', e);
      alert('No authenticated user or session');
    }
  };

  return (
    <Authenticator loginMechanisms={['email']} signUpAttributes={['name']}>
      {({ signOut, user }) => (
        <main className="p-6 space-y-4">
          <h1>Hello {name ?? email ?? user?.signInDetails?.loginId ?? user?.username}</h1>
          <p>Secret message</p>

          <button onClick={getUserData} className="border px-3 py-2 rounded">
            Call API (Log Tokens)
          </button>
          <br />

          <button
            onClick={signOut}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Sign out
          </button>
        </main>
      )}
    </Authenticator>
  );
}

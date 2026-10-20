import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Notice, Screen, TextField, Title } from '@/components/ui';

/** Colar o link de convite recebido (quando ele não abriu o app direto). */
export default function PasteInvite() {
  const [link, setLink] = useState('');
  const [error, setError] = useState(false);

  function open() {
    const token = /([A-Za-z0-9_-]{43})\/?$/.exec(link.trim())?.[1];
    if (!token) {
      setError(true);
      return;
    }
    router.replace(`/convite/${token}`);
  }

  return (
    <Screen>
      <Title>Recebi um convite</Title>
      <Body muted>Cole aqui o link que seu assessor ou seu par enviou.</Body>
      <TextField
        label="Link do convite"
        value={link}
        onChangeText={(t) => {
          setLink(t);
          setError(false);
        }}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? (
        <Notice tone="alert">Esse link não parece um convite do Sr. Casamentos.</Notice>
      ) : null}
      <Button label="Abrir convite" onPress={open} />
      <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

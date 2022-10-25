import {
  Button,
  Input,
  Layout,
  Spinner,
  TopNavigation,
  TopNavigationAction,
  useTheme,
} from '@ui-kitten/components';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppContext } from '../../Contexts/AppContext';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Event } from '../../lib/nostr/Events';
import { useTranslation } from 'react-i18next';
import { RelayPoolContext } from '../../Contexts/RelayPoolContext';
import moment from 'moment';
import { getNotes } from '../../Functions/DatabaseFunctions/Notes';
import { getETags } from '../../Functions/RelayFunctions/Events';

export const SendPage: React.FC = () => {
  const theme = useTheme();
  const { setPage, page, database } = useContext(AppContext);
  const { relayPool, publicKey, lastEventId } = useContext(RelayPoolContext);
  const { t } = useTranslation('common');
  const [content, setContent] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [noteId, setNoteId] = useState<string>();
  const breadcrump = page.split('%');
  const eventId = breadcrump[breadcrump.length - 1].split('#')[1];

  useEffect(() => {
    if (sending && noteId === lastEventId) {
      setPage(breadcrump.slice(0, -1).join('%') || 'home');
    }
  }, [lastEventId]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    actionContainer: {
      marginTop: 30,
      paddingLeft: 32,
      paddingRight: 32,
    },
    button: {
      marginTop: 30,
    },
  });

  const onPressBack: () => void = () => {
    setPage(breadcrump.slice(0, -1).join('%'));
  };

  const onPressSend: () => void = () => {
    getNotes(database, { filters: { id: eventId } }).then((notes) => {
      let tags: string[][] = [];
      const note = notes[0];

      if (note) {
        tags = note.tags;
        if (getETags(note).length === 0) {
          tags.push(['e', eventId, '', 'root']);
        } else {
          tags.push(['e', eventId, '', 'reply']);
        }
      }

      const event: Event = {
        content,
        created_at: moment().unix(),
        kind: 1,
        pubkey: publicKey,
        tags,
      };
      relayPool?.sendEvent(event);
      setNoteId(note.id);
      setSending(true);
    });
  };

  const renderBackAction = (): JSX.Element => (
    <TopNavigationAction
      icon={<Icon name='arrow-left' size={16} color={theme['text-basic-color']} />}
      onPress={onPressBack}
    />
  );

  return (
    <>
      <Layout style={styles.container} level='2'>
        <TopNavigation
          alignment='center'
          title={t('sendPage.title')}
          accessoryLeft={renderBackAction}
        />
        <Layout style={styles.actionContainer} level='2'>
          <Layout>
            <Input
              multiline={true}
              textStyle={{ minHeight: 64 }}
              placeholder={t('sendPage.placeholder')}
              value={content}
              onChangeText={setContent}
              size='large'
              autoFocus={true}
              keyboardType='twitter'
            />
          </Layout>
          <Layout style={styles.button}>
            <Button
              onPress={onPressSend}
              disabled={sending}
              accessoryLeft={sending ? <Spinner size='tiny' /> : <></>}
            >
              {t('sendPage.send')}
            </Button>
          </Layout>
        </Layout>
      </Layout>
    </>
  );
};

export default SendPage;

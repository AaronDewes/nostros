import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';
import { Text, useTheme } from 'react-native-paper'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { goBack } from '../../lib/Navigation'
import { AppContext } from '../../Contexts/AppContext'

export const QrReaderPage: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation('common')
  const [hasPermission, setHasPermission] = React.useState<boolean>(true);

  const videoRef =React. useRef<HTMLVideoElement>(null);
  const reader = React.useRef(new BrowserMultiFormatReader());
  reader.current.hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
  React.useEffect(() => {
    if (!videoRef.current) return;
    reader.current.decodeFromConstraints(
      {
        audio: false,
        video: {
          facingMode: 'environment',
        },
      },
      videoRef.current,
      (result, error) => {
        if (result) console.log(result);
        if (error) console.log(error);
      }
    );
    return () => {
      reader.current.reset();
    }
  }, [videoRef]);

  const NoPermissionsComponent = React.useMemo(
    () => (
      <View style={styles.blank}>
        <MaterialCommunityIcons
          name='camera-off-outline'
          size={64}
          style={styles.center}
          color={theme.colors.onPrimaryContainer}
        />
        <Text variant='headlineSmall' style={styles.center}>
          {t('qrReaderPage.emptyTitle')}
        </Text>
      </View>
    ),
    [],
  )

  if (hasPermission === undefined) return <></>
  return hasPermission ? (
    <View style={styles.container}>
      <View style={styles.reader}>
        <video ref={videoRef} />
      </View>
      <View style={styles.title}>
        <MaterialCommunityIcons
          name='qrcode'
          size={64}
          style={styles.center}
          color={theme.colors.onPrimaryContainer}
        />
        <Text variant='headlineSmall' style={styles.center}>
          {t('qrReaderPage.QRreader')}
        </Text>
      </View>
    </View>
    ) : (
      NoPermissionsComponent
  )
}

const styles = StyleSheet.create({
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  center: {
    alignContent: 'center',
    textAlign: 'center',
  },
  blank: {
    justifyContent: 'space-between',
    height: 170,
    marginTop: 50,
  },
  title: {
    justifyContent: 'space-between',
    height: 120,
    marginTop: 50,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
  },
  reader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
  },
  camera: {
    height: 300,
    width: 300,
  },
})

export default QrReaderPage

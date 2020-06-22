import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Text, View, ScrollView, StyleSheet, Alert, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import StyledButton from '../../UI/StyledButton';
import { colors, fontStyles, baseStyles } from '../../../styles/common';
import OnboardingScreenWithBg from '../../UI/OnboardingScreenWithBg';
import { strings } from '../../../../locales/i18n';
import Button from 'react-native-button';
import { connect } from 'react-redux';
import SecureKeychain from '../../../core/SecureKeychain';
import Engine from '../../../core/Engine';
import FadeOutOverlay from '../../UI/FadeOutOverlay';
import TermsAndConditions from '../TermsAndConditions';
import Analytics from '../../../core/Analytics';
import { ANALYTICS_EVENT_OPTS } from '../../../util/analytics';
import { saveOnboardingEvent } from '../../../actions/onboarding';
import { getTransparentBackOnboardingNavbarOptions } from '../../UI/Navbar';
import OnboardingProgress from '../../UI/OnboardingProgress';

const styles = StyleSheet.create({
	scroll: {
		flexGrow: 1
	},
	wrapper: {
		paddingHorizontal: 40,
		paddingVertical: 30,
		flex: 1
	},
	termsAndConditions: {
		paddingVertical: 30
	},
	title: {
		fontSize: 24,
		color: colors.fontPrimary,
		...fontStyles.bold,
		textAlign: 'center'
	},
	subTitle: {
		fontSize: 16,
		color: colors.fontPrimary,
		...fontStyles.bold,
		textAlign: 'center',
		marginBottom: 10
	},
	ctas: {
		flex: 1
	},
	footer: {
		marginTop: -20,
		marginBottom: 20
	},
	login: {
		fontSize: 18,
		color: colors.blue,
		...fontStyles.normal
	},
	buttonDescription: {
		...fontStyles.normal,
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 16,
		color: colors.fontSecondary,
		lineHeight: 20
	},
	importWrapper: {
		marginVertical: 24
	},
	createWrapper: {
		// marginVertical: 24
	},
	buttonWrapper: {
		flexGrow: 1,
		marginHorizontal: 50
	}
});

const steps = [strings('onboarding.step1'), strings('onboarding.step2'), strings('onboarding.step3')];
// const steps = ['Create password', 'Secure wallet', 'Confirm seed phrase'];

/**
 * View that is displayed to first time (new) users
 */
class Onboarding extends PureComponent {
	static navigationOptions = ({ navigation }) => getTransparentBackOnboardingNavbarOptions(navigation);

	static propTypes = {
		/**
		 * The navigator object
		 */
		navigation: PropTypes.object,
		/**
		 * redux flag that indicates if the user set a password
		 */
		passwordSet: PropTypes.bool,
		/**
		 * Save onboarding event to state
		 */
		saveOnboardingEvent: PropTypes.func
	};

	state = {
		existingUser: false,
		currentStep: 1
	};

	componentDidMount() {
		this.checkIfExistingUser();
	}

	async checkIfExistingUser() {
		const existingUser = await AsyncStorage.getItem('@MetaMask:existingUser');
		if (existingUser !== null) {
			this.setState({ existingUser: true });
		}
	}

	onLogin = async () => {
		const { passwordSet } = this.props;
		if (!passwordSet) {
			const { KeyringController } = Engine.context;
			// Restore vault with empty password
			await KeyringController.submitPassword('');
			await SecureKeychain.resetGenericPassword();
			this.props.navigation.navigate('HomeNav');
		} else {
			this.props.navigation.navigate('Login');
		}
	};

	track = key => {
		InteractionManager.runAfterInteractions(async () => {
			if (Analytics.getEnabled()) {
				Analytics.trackEvent(key);
				return;
			}
			const metricsOptIn = await AsyncStorage.getItem('@MetaMask:metricsOptIn');
			if (!metricsOptIn) {
				this.props.saveOnboardingEvent(key);
			}
		});
	};

	onPressCreate = () => {
		// const { existingUser } = this.state;
		// const action = () => {
		// 	this.props.navigation.navigate('CreateWallet');
		// 	this.track(ANALYTICS_EVENT_OPTS.ONBOARDING_SELECTED_CREATE_NEW_WALLET);
		// };
		// if (existingUser) {
		// 	this.alertExistingUser(action);
		// } else {
		// 	action();
		// }
		this.props.navigation.navigate('ChoosePassword');
		this.track(ANALYTICS_EVENT_OPTS.ONBOARDING_SELECTED_CREATE_NEW_PASSWORD);
	};

	onPressImport = () => {
		this.props.navigation.push('ImportWallet');
		this.track(ANALYTICS_EVENT_OPTS.ONBOARDING_SELECTED_IMPORT_WALLET);
	};

	alertExistingUser = callback => {
		Alert.alert(
			strings('sync_with_extension.warning_title'),
			strings('sync_with_extension.warning_message'),
			[
				{ text: strings('sync_with_extension.warning_cancel_button'), onPress: () => false, style: 'cancel' },
				{ text: strings('sync_with_extension.warning_ok_button'), onPress: () => callback() }
			],
			{ cancelable: false }
		);
	};

	render() {
		return (
			<View style={baseStyles.flexGrow} testID={'onboarding-screen'}>
				<OnboardingScreenWithBg screen={'c'}>
					<ScrollView style={baseStyles.flexGrow} contentContainerStyle={styles.scroll}>
						<View style={styles.wrapper}>
							<View style={styles.ctas}>
								<OnboardingProgress
									marginHorizontal={24}
									steps={steps}
									currentStep={this.state.currentStep}
								/>
								<Text style={styles.title} testID={'onboarding-screen-title'}>
									{strings('onboarding.title')}
								</Text>
								<View style={styles.importWrapper}>
									<Text style={styles.buttonDescription}>{strings('onboarding.sync_desc')}</Text>
									<Text style={styles.subTitle}>{strings('onboarding.already_have')}</Text>
									<Text style={styles.buttonDescription}>{strings('onboarding.sync_existing')}</Text>
									<View style={styles.buttonWrapper}>
										<StyledButton
											type={'normal'}
											onPress={this.onPressImport}
											testID={'onboarding-import-button'}
										>
											{strings('onboarding.import_wallet_button')}
										</StyledButton>
									</View>
								</View>
								<View style={styles.createWrapper}>
									<Text style={styles.subTitle}>{strings('onboarding.new_to_crypto')}</Text>
									<Text style={styles.buttonDescription}>{strings('onboarding.create_desc')}</Text>
									<View style={styles.buttonWrapper}>
										<StyledButton
											type={'blue'}
											onPress={this.onPressCreate}
											testID={'start-exploring-button'}
										>
											{strings('onboarding.start_exploring_now')}
										</StyledButton>
									</View>
								</View>
							</View>
						</View>

						{this.state.existingUser && (
							<View style={styles.footer}>
								<Button style={styles.login} onPress={this.onLogin}>
									{strings('onboarding.login')}
								</Button>
							</View>
						)}
					</ScrollView>
					<View style={styles.termsAndConditions}>
						<TermsAndConditions navigation={this.props.navigation} />
					</View>
				</OnboardingScreenWithBg>
				<FadeOutOverlay />
			</View>
		);
	}
}

const mapStateToProps = state => ({
	passwordSet: state.user.passwordSet
});

const mapDispatchToProps = dispatch => ({
	saveOnboardingEvent: event => dispatch(saveOnboardingEvent(event))
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Onboarding);

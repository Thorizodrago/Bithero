import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';

const Blob = ({ size, left, top, delay, duration, color, opacity }: { size: number; left: number; top: number; delay: number; duration: number; color: string; opacity: number; }) => {
	const anim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const useNative = Platform.OS !== 'web';
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(anim, { toValue: 1, duration, delay, useNativeDriver: useNative }),
				Animated.timing(anim, { toValue: 0, duration, useNativeDriver: useNative })
			])
		);
		loop.start();
		return () => loop.stop();
	}, [anim, delay, duration]);

	const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
	const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

	return (
		<Animated.View
			style={[
				styles.blob,
				{
					width: size,
					height: size,
					left,
					top,
					backgroundColor: color,
					opacity,
					transform: [{ translateY }, { translateX }],
					pointerEvents: 'none' as any,
				},
			]}
		/>
	);
};

export default function SoftBackground() {
	// Disabled for clean black background theme
	return null;
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	blob: {
		position: 'absolute',
		borderRadius: 9999,
		filter: 'blur(40px)' as any, // web only; ignored on native
	},
});

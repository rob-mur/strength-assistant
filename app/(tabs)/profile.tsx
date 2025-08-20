import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Title, Paragraph, Button, List, Divider } from "react-native-paper";
import { useAuthContext } from "@/lib/components/AuthProvider";

export default function ProfileScreen() {
	const { user, signOut } = useAuthContext();

	const handleSignOut = async () => {
		await signOut();
	};

	return (
		<View style={styles.container}>
			<Card style={styles.card}>
				<Card.Content>
					<Title style={styles.title}>Profile</Title>
					
					<View style={styles.userInfo}>
						<List.Item
							title="User ID"
							description={user?.uid || "N/A"}
							left={(props) => <List.Icon {...props} icon="account-circle" />}
						/>
						<List.Item
							title="Email"
							description={user?.email || "Anonymous User"}
							left={(props) => <List.Icon {...props} icon="email" />}
						/>
						<List.Item
							title="Account Type"
							description={user?.isAnonymous ? "Guest Account" : "Registered Account"}
							left={(props) => <List.Icon {...props} icon={user?.isAnonymous ? "incognito" : "account-check"} />}
						/>
					</View>

					<Divider style={styles.divider} />

					<View style={styles.actions}>
						<Paragraph style={styles.signOutDescription}>
							{user?.isAnonymous 
								? "Sign out of your guest account. Your data will be lost unless you create a permanent account first."
								: "Sign out of your account. You can sign back in anytime."
							}
						</Paragraph>
						
						<Button
							mode="contained"
							onPress={handleSignOut}
							style={styles.signOutButton}
							buttonColor="#d32f2f"
						>
							Sign Out
						</Button>
					</View>
				</Card.Content>
			</Card>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#f5f5f5",
	},
	card: {
		marginTop: 20,
	},
	title: {
		textAlign: "center",
		marginBottom: 20,
	},
	userInfo: {
		marginBottom: 16,
	},
	divider: {
		marginVertical: 16,
	},
	actions: {
		alignItems: "center",
	},
	signOutDescription: {
		textAlign: "center",
		marginBottom: 16,
		color: "#666",
	},
	signOutButton: {
		minWidth: 150,
	},
});
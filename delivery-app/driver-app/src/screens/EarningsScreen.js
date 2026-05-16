import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function EarningsScreen() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  async function fetchEarningsData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletData) {
        setWallet(walletData);

        // Fetch transactions
        const { data: transData } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false });

        setTransactions(transData || []);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0288d1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>${wallet?.balance || '0.00'}</Text>
      </View>

      <Text style={styles.header}>Transaction History</Text>

      {transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No earnings yet. Complete an order to earn!</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.transactionRow}>
              <View>
                <Text style={styles.transactionType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
                {item.description && <Text style={styles.transactionDesc}>{item.description}</Text>}
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: item.type === 'withdrawal' || item.type === 'commission_deduction' ? '#d32f2f' : '#2e7d32' }
              ]}>
                {item.type === 'withdrawal' || item.type === 'commission_deduction' ? '-' : '+'}${item.amount}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: '#0288d1',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#e1f5fe',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 10,
    color: '#333',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionType: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  transactionDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  transactionDesc: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 18,
  }
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RestaurantScreen({ route, navigation }) {
  const { restaurant, name } = route.params;
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  // Modifiers state
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemModifiers, setItemModifiers] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true);

      if (error) console.error('Error fetching menu', error);
      else setMenu(data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleItemPress = async (item) => {
    // Fetch modifiers for this item
    const { data: groups } = await supabase
      .from('item_modifier_groups')
      .select('*, item_modifier_options(*)')
      .eq('menu_item_id', item.id);

    if (groups && groups.length > 0) {
      setSelectedItem(item);
      setItemModifiers(groups);
      setSelectedOptions({});
      setModalVisible(true);
    } else {
      // No modifiers, add directly to cart
      addToCart({ ...item, selectedOptions: [], finalPrice: item.price });
    }
  };

  const toggleOption = (groupId, option, maxSelections) => {
    const currentSelections = selectedOptions[groupId] || [];
    const isSelected = currentSelections.find(opt => opt.id === option.id);

    let newSelections = [...currentSelections];
    if (isSelected) {
      newSelections = newSelections.filter(opt => opt.id !== option.id);
    } else {
      if (currentSelections.length < maxSelections) {
        newSelections.push(option);
      } else if (maxSelections === 1) {
        // Replace if it's a single choice (like radio button)
        newSelections = [option];
      } else {
        return; // Max reached
      }
    }

    setSelectedOptions({ ...selectedOptions, [groupId]: newSelections });
  };

  const confirmItemAdd = () => {
    // Validate required groups
    for (let group of itemModifiers) {
      if (group.is_required && (!selectedOptions[group.id] || selectedOptions[group.id].length === 0)) {
        Alert.alert('Required Selection', `Please select an option for ${group.name}`);
        return;
      }
    }

    let extraCost = 0;
    const optionsArray = [];
    Object.values(selectedOptions).forEach(opts => {
      opts.forEach(opt => {
        extraCost += Number(opt.price);
        optionsArray.push(opt);
      });
    });

    addToCart({
      ...selectedItem,
      selectedOptions: optionsArray,
      finalPrice: Number(selectedItem.price) + extraCost
    });

    setModalVisible(false);
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const handleOrder = () => {
    navigation.navigate('Checkout', { cart, restaurant });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menu for {name}</Text>

      {menu.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No menu items available.</Text>
        </View>
      ) : (
        <FlatList
          data={menu}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.menuItem} onPress={() => handleItemPress(item)}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                <Text style={styles.itemPrice}>${item.price}</Text>
              </View>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>Add</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <Text style={styles.cartText}>{cart.length} items - ${cart.reduce((s, i) => s + Number(i.finalPrice), 0).toFixed(2)}</Text>
          <TouchableOpacity style={styles.orderButton} onPress={handleOrder}>
            <Text style={styles.orderButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modifiers Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Customize {selectedItem?.name}</Text>
            <ScrollView>
              {itemModifiers.map(group => (
                <View key={group.id} style={styles.modifierGroup}>
                  <Text style={styles.groupTitle}>
                    {group.name} {group.is_required && <Text style={styles.requiredText}>(Required)</Text>}
                  </Text>
                  <Text style={styles.groupSub}>Choose up to {group.max_selections}</Text>

                  {group.item_modifier_options?.map(option => {
                    const isSelected = selectedOptions[group.id]?.find(o => o.id === option.id);
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.optionRow}
                        onPress={() => toggleOption(group.id, option, group.max_selections)}
                      >
                        <Text style={[styles.optionName, isSelected && styles.optionSelected]}>{option.name}</Text>
                        <View style={styles.optionRight}>
                          {Number(option.price) > 0 && <Text style={styles.optionPrice}>+${option.price}</Text>}
                          <View style={[styles.checkbox, isSelected && styles.checkboxActive]} />
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmItemAdd}>
                <Text style={styles.confirmBtnText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff', paddingBottom: 80 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  itemPrice: { color: '#888', marginTop: 4, fontWeight: 'bold' },
  addButton: { backgroundColor: '#e8f5e9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#2e7d32', fontWeight: 'bold' },
  emptyText: { fontSize: 16, color: '#666' },
  cartFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  cartText: { fontSize: 16, fontWeight: 'bold' },
  orderButton: { backgroundColor: '#2e7d32', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  orderButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modifierGroup: { marginBottom: 20 },
  groupTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  requiredText: { color: '#d32f2f', fontSize: 12 },
  groupSub: { fontSize: 12, color: '#888', marginBottom: 8 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionName: { fontSize: 15, color: '#444' },
  optionSelected: { fontWeight: 'bold', color: '#2e7d32' },
  optionRight: { flexDirection: 'row', alignItems: 'center' },
  optionPrice: { color: '#666', marginRight: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ccc' },
  checkboxActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  confirmBtn: { padding: 15, flex: 1, backgroundColor: '#2e7d32', borderRadius: 8, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontWeight: 'bold' }
});

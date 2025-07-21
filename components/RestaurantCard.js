import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function RestaurantCard({ restaurant, onPress }) {
  const uri = restaurant.imageUrl
    ? restaurant.imageUrl
    : 'https://via.placeholder.com/400x200?text=Kein+Bild';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri }} style={styles.img}/>
      <View style={styles.textWrap}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.details}>
          {restaurant.type} ・ {restaurant.rating?.toFixed(1)||'–'}★ ・{' '}
          <Text style={{color:restaurant.openNow?colors.success:colors.error}}>
            {restaurant.openNow?'Geöffnet':'Geschlossen'}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor:'#fff', borderRadius:12, marginBottom:16, overflow:'hidden', elevation:2, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:6 },
  img:     { width:'100%', height:180 },
  textWrap:{ padding:12 },
  name:    { fontSize:18, fontWeight:'bold', marginBottom:4 },
  details: { fontSize:14, color:colors.textSecondary }
});

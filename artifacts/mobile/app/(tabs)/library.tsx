import React, { useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useApp } from "@/contexts/AppContext";
import { PHRASE_CATEGORIES, type Phrase, type PhraseCategory } from "@/constants/phraseLibrary";
import { speakText, stopSpeaking } from "@/services/speechService";
import { translateToUrdu } from "@/services/translationService";

// ── Word Lookup Box ─────────────────────────────────────────────────────────
function WordLookup() {
  const colors = useColors();
  const [word, setWord] = useState("");
  const [urdu, setUrdu] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleTranslate() {
    if (!word.trim()) return;
    setLoading(true);
    setError(false);
    setUrdu("");
    try {
      const result = await translateToUrdu(word.trim());
      setUrdu(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.lookupBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.lookupHeader}>
        <Feather name="globe" size={14} color={colors.primary} />
        <Text style={[styles.lookupTitle, { color: colors.primary }]}>Urdu Word Lookup</Text>
      </View>
      <View style={styles.lookupRow}>
        <TextInput
          style={[styles.lookupInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Type any word or phrase..."
          placeholderTextColor={colors.mutedForeground}
          value={word}
          onChangeText={setWord}
          onSubmitEditing={handleTranslate}
          returnKeyType="search"
        />
        <Pressable
          style={[styles.lookupBtn, { backgroundColor: colors.primary }]}
          onPress={handleTranslate}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Feather name="arrow-right" size={16} color="#fff" />
          }
        </Pressable>
      </View>
      {urdu ? (
        <View style={[styles.lookupResult, { backgroundColor: "#22c55e10", borderColor: "#22c55e30" }]}>
          <Text style={styles.urduFlag}>🇵🇰</Text>
          <Text style={[styles.urduText, { color: colors.foreground }]}>{urdu}</Text>
        </View>
      ) : error ? (
        <Text style={[styles.lookupError, { color: colors.destructive }]}>Translation failed. Check your connection.</Text>
      ) : null}
    </View>
  );
}

// ── Category Chip ───────────────────────────────────────────────────────────
function CategoryChip({ category, selected, onPress }: {
  category: PhraseCategory; selected: boolean; onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={[styles.chip, { backgroundColor: selected ? category.color : colors.card, borderColor: selected ? category.color : colors.border }]}
      onPress={onPress}
    >
      <Feather name={category.icon as any} size={13} color={selected ? "#fff" : colors.mutedForeground} />
      <Text style={[styles.chipLabel, { color: selected ? "#fff" : colors.mutedForeground }]}>
        {category.label}
      </Text>
    </Pressable>
  );
}

// ── Phrase Card ─────────────────────────────────────────────────────────────
function PhraseCard({
  phrase,
  categoryColor,
  onListen,
  isPlaying,
  isFavorite,
  onToggleFavorite,
}: {
  phrase: Phrase;
  categoryColor: string;
  onListen: (phrase: Phrase) => void;
  isPlaying: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [urdu, setUrdu] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(false);

  async function handleTranslate() {
    if (urdu) { setUrdu(null); return; } // toggle off
    setTranslating(true);
    setTranslateError(false);
    try {
      const result = await translateToUrdu(phrase.text);
      setUrdu(result);
    } catch {
      setTranslateError(true);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded(e => !e)}
    >
      <View style={[styles.quotebar, { backgroundColor: categoryColor }]} />
      <View style={styles.cardContent}>

        {/* Favorite + translate row */}
        <View style={styles.cardActions}>
          <Pressable
            style={[styles.translateActionBtn, { backgroundColor: urdu ? "#22c55e20" : colors.secondary, borderColor: urdu ? "#22c55e50" : colors.border }]}
            onPress={handleTranslate}
          >
            {translating
              ? <ActivityIndicator size="small" color={categoryColor} />
              : <><Feather name="globe" size={12} color={urdu ? "#22c55e" : colors.mutedForeground} />
                <Text style={[styles.translateActionText, { color: urdu ? "#22c55e" : colors.mutedForeground }]}>
                  {urdu ? "Hide Urdu" : "Translate"}
                </Text></>
            }
          </Pressable>
          <Pressable
            onPress={() => { onToggleFavorite(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            hitSlop={10}
          >
            <Feather name="heart" size={17} color={isFavorite ? "#ef4444" : colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Urdu translation */}
        {urdu && (
          <View style={[styles.urduBlock, { backgroundColor: "#22c55e10", borderColor: "#22c55e30" }]}>
            <Text style={styles.urduFlag}>🇵🇰 اردو</Text>
            <Text style={[styles.urduBlockText, { color: colors.foreground }]} selectable>
              {urdu}
            </Text>
          </View>
        )}
        {translateError && (
          <Text style={[styles.translateErr, { color: colors.destructive }]}>
            Translation failed. Check connection.
          </Text>
        )}

        {/* English phrase */}
        <Text selectable style={[styles.phraseText, { color: colors.foreground }]}>
          "{phrase.text}"
        </Text>

        {/* Expandable details */}
        {expanded && (
          <View style={styles.details}>
            <View style={[styles.detailBlock, { backgroundColor: colors.background }]}>
              <View style={styles.detailHeader}>
                <Feather name="clock" size={12} color={categoryColor} />
                <Text style={[styles.detailTitle, { color: categoryColor }]}>When to use</Text>
              </View>
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{phrase.whenToUse}</Text>
            </View>
            <View style={[styles.detailBlock, { backgroundColor: colors.background }]}>
              <View style={styles.detailHeader}>
                <Feather name="zap" size={12} color={categoryColor} />
                <Text style={[styles.detailTitle, { color: categoryColor }]}>Delivery tip</Text>
              </View>
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{phrase.tip}</Text>
            </View>
          </View>
        )}

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <Pressable style={styles.expandBtn} onPress={() => setExpanded(e => !e)}>
            <Text style={[styles.expandText, { color: colors.mutedForeground }]}>
              {expanded ? "Less" : "When to use + tip"}
            </Text>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={[styles.listenBtn, { backgroundColor: isPlaying ? categoryColor : categoryColor + "20" }]}
            onPress={() => onListen(phrase)}
          >
            <Feather name={isPlaying ? "square" : "volume-2"} size={14} color={isPlaying ? "#fff" : categoryColor} />
            <Text style={[styles.listenText, { color: isPlaying ? "#fff" : categoryColor }]}>
              {isPlaying ? "Stop" : "Listen"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { favoritePhraseIds, toggleFavoritePhrase } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("openers");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const activeCategory = PHRASE_CATEGORIES.find(c => c.id === selectedCategory)!;

  const filteredPhrases = activeCategory.phrases.filter(p => {
    if (showFavoritesOnly && !favoritePhraseIds.includes(p.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.text.toLowerCase().includes(q) || p.whenToUse.toLowerCase().includes(q) || p.tip.toLowerCase().includes(q);
  });

  const handleListen = useCallback(async (phrase: Phrase) => {
    if (playingId === phrase.id) {
      await stopSpeaking();
      setPlayingId(null);
      return;
    }
    setPlayingId(phrase.id);
    await speakText(phrase.text, {
      voiceType: "agent",
      onDone: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  }, [playingId]);

  const totalFavorites = PHRASE_CATEGORIES.reduce(
    (sum, cat) => sum + cat.phrases.filter(p => favoritePhraseIds.includes(p.id)).length, 0
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Phrase Library</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {PHRASE_CATEGORIES.reduce((s, c) => s + c.phrases.length, 0)} phrases · {PHRASE_CATEGORIES.length} categories
            </Text>
          </View>
          <Pressable
            style={[styles.favFilterBtn, {
              backgroundColor: showFavoritesOnly ? "#ef444420" : colors.secondary,
              borderColor: showFavoritesOnly ? "#ef4444" : colors.border,
            }]}
            onPress={() => setShowFavoritesOnly(f => !f)}
          >
            <Feather name="heart" size={14} color={showFavoritesOnly ? "#ef4444" : colors.mutedForeground} />
            {totalFavorites > 0 && (
              <Text style={[styles.favCount, { color: showFavoritesOnly ? "#ef4444" : colors.mutedForeground }]}>
                {totalFavorites}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Word lookup */}
        <WordLookup />

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search phrases..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PHRASE_CATEGORIES.map(cat => (
            <CategoryChip
              key={cat.id}
              category={cat}
              selected={selectedCategory === cat.id}
              onPress={() => {
                setSelectedCategory(cat.id);
                setSearch("");
                setPlayingId(null);
                stopSpeaking();
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Category description */}
      <View style={[styles.catDesc, { backgroundColor: activeCategory.color + "12", borderBottomColor: activeCategory.color + "30" }]}>
        <Feather name={activeCategory.icon as any} size={14} color={activeCategory.color} />
        <Text style={[styles.catDescText, { color: activeCategory.color }]}>{activeCategory.description}</Text>
      </View>

      {/* Phrase list */}
      <FlatList
        data={filteredPhrases}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PhraseCard
            phrase={item}
            categoryColor={activeCategory.color}
            onListen={handleListen}
            isPlaying={playingId === item.id}
            isFavorite={favoritePhraseIds.includes(item.id)}
            onToggleFavorite={() => toggleFavoritePhrase(item.id)}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name={showFavoritesOnly ? "heart" : "search"} size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {showFavoritesOnly ? "No favourites yet" : `No results for "${search}"`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {showFavoritesOnly ? "Tap the heart icon on any phrase to save it here." : "Try a different search term."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  favFilterBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  favCount: { fontSize: 13, fontWeight: "700" },
  // Word lookup
  lookupBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 10, marginBottom: 14 },
  lookupHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  lookupTitle: { fontSize: 13, fontWeight: "700" },
  lookupRow: { flexDirection: "row", gap: 8 },
  lookupInput: { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  lookupBtn: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  lookupResult: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  urduFlag: { fontSize: 16 },
  urduText: { flex: 1, fontSize: 16, textAlign: "right", fontWeight: "500", lineHeight: 26 },
  lookupError: { fontSize: 12 },
  // Search
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15 },
  chips: { flexDirection: "row", gap: 8, paddingBottom: 14, paddingRight: 4 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  // Category desc
  catDesc: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  catDescText: { flex: 1, fontSize: 13, fontWeight: "500" },
  list: { padding: 16, gap: 12 },
  // Card
  card: { borderRadius: 14, borderWidth: 1, flexDirection: "row", overflow: "hidden" },
  quotebar: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 10 },
  cardActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  translateActionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  translateActionText: { fontSize: 12, fontWeight: "600" },
  urduBlock: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  urduBlockText: { fontSize: 16, textAlign: "right", lineHeight: 28, fontWeight: "500" },
  translateErr: { fontSize: 12 },
  phraseText: { fontSize: 15, lineHeight: 23, fontStyle: "italic" },
  details: { gap: 8 },
  detailBlock: { borderRadius: 10, padding: 12, gap: 6 },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  detailText: { fontSize: 13, lineHeight: 19 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  expandBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  expandText: { fontSize: 12 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  listenText: { fontSize: 13, fontWeight: "600" },
  empty: { paddingTop: 60, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
});

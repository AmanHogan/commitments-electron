import { useState } from "react"
import { Link } from "react-router-dom"
import type { FlashCard, FlashCardSet } from "@/types/types"
import { Markdown } from "@/components/markdown"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface Group {
  set: Pick<FlashCardSet, "id" | "title">
  cards: FlashCard[]
}

interface Props {
  groups: Group[]
}

export function FcStarredPage({ groups }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No starred cards yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Star cards while studying to save them here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(({ set, cards }) => (
        <div key={set.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <Link to={`/flashcards/sets/${set.id}`} className="text-lg font-semibold hover:underline">{set.title}</Link>
            <Badge variant="secondary">{cards.length} starred</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map(card => {
              const open = expanded[card.id]
              return (
                <Card
                  key={card.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpanded(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium mb-1"><Markdown>{card.term}</Markdown></div>
                        {open && (
                          <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
                            <Markdown>{card.definition}</Markdown>
                          </div>
                        )}
                        {!open && <p className="text-xs text-muted-foreground">Click to reveal definition</p>}
                        {card.groupName && <Badge variant="outline" className="text-xs mt-2">{card.groupName}</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function createAthleteItem(athlete) {
    return `
        <div class="athlete-item">
            <div class="athlete-rank">${athlete.Rank}</div>
            <div class="athlete-avatar">
                <div class="tooltip-item">
                    <div class="tooltip-header">
                        <div class="tooltip-avatar"></div>
                        <div class="tooltip-title">
                            <div class="tooltip-name">${athlete.Name}</div>
                            <div class="tooltip-rank">Rank ${athlete.Rank}</div>
                        </div>
                    </div>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="tooltip-label">Region:</span>
                            <span class="tooltip-value">${athlete.Region}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Total Points:</span>
                            <span class="tooltip-value">${athlete.TotalPoints}</span>
                        </div>
                        <a href="https://topheats.ru/athletes/${encodeURIComponent(athlete.Name)}" 
                           class="tooltip-social"
                           target="_blank">
                            View Social Profile
                        </a>
                    </div>
                </div>
            </div>
            <div class="athlete-info">
                <div class="athlete-name">${athlete.Name}</div>
                <div class="athlete-region">${athlete.Region}</div>
            </div>
            <div class="athlete-points">${athlete.TotalPoints}</div>
        </div>
    `;
}